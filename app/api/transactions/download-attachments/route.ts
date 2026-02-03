import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import archiver from 'archiver'
import { existsSync, createReadStream } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 필터 조건 구성 (export API와 동일)
    const where: any = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { counterparty: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (type && type !== 'all') {
      if (type === 'income') {
        where.amount = { gt: 0 }
      } else if (type === 'expense') {
        where.amount = { lt: 0 }
      }
    }

    // 거래내역과 첨부파일 조회
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        attachments: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 첨부파일이 있는 거래만 필터링
    const transactionsWithAttachments = transactions.filter(
      t => t.attachments && t.attachments.length > 0
    )

    if (transactionsWithAttachments.length === 0) {
      return NextResponse.json(
        { success: false, error: '다운로드할 첨부파일이 없습니다.' },
        { status: 404 }
      )
    }

    // ZIP 파일명 생성
    const dateRangePart = startDate && endDate
      ? `_${startDate}_${endDate}`
      : startDate
      ? `_${startDate}_이후`
      : endDate
      ? `_${endDate}_이전`
      : ''
    const fileName = `거래첨부파일${dateRangePart}_${new Date().toISOString().split('T')[0]}.zip`

    // archiver를 사용하여 ZIP 생성
    const archive = archiver('zip', {
      zlib: { level: 9 } // 최대 압축
    })

    // 파일을 ZIP에 추가 (수입/지출 폴더로 구분)
    let fileCount = 0
    const usedFileNames = new Map<string, number>() // 중복 파일명 관리

    for (const transaction of transactionsWithAttachments) {
      const transactionDate = new Date(transaction.date).toISOString().split('T')[0]
      const folderName = transaction.amount > 0 ? '수입' : '지출'

      for (const attachment of transaction.attachments) {
        const filePath = join(process.cwd(), attachment.filePath)

        if (existsSync(filePath)) {
          // 파일명 앞에 날짜 추가
          let fileName = `${transactionDate}_${attachment.fileName}`
          let zipPath = `${folderName}/${fileName}`

          // 중복 파일명 처리
          if (usedFileNames.has(zipPath)) {
            const count = usedFileNames.get(zipPath)! + 1
            usedFileNames.set(zipPath, count)

            // 파일명에 번호 추가 (확장자 앞에)
            const lastDotIndex = fileName.lastIndexOf('.')
            if (lastDotIndex > 0) {
              fileName = `${fileName.substring(0, lastDotIndex)}_${count}${fileName.substring(lastDotIndex)}`
            } else {
              fileName = `${fileName}_${count}`
            }
            zipPath = `${folderName}/${fileName}`
          } else {
            usedFileNames.set(zipPath, 1)
          }

          archive.file(filePath, { name: zipPath })
          fileCount++
        } else {
          console.warn(`File not found: ${filePath}`)
        }
      }
    }

    if (fileCount === 0) {
      return NextResponse.json(
        { success: false, error: '다운로드할 수 있는 파일이 없습니다. 파일이 삭제되었을 수 있습니다.' },
        { status: 404 }
      )
    }

    // archive를 finalize하여 스트림 완료
    archive.finalize()

    // Node.js Stream을 Web ReadableStream으로 변환
    const webStream = Readable.toWeb(archive as any) as ReadableStream

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading attachments:', error)
    return NextResponse.json(
      {
        success: false,
        error: '첨부파일 다운로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 파일명 sanitize 함수
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣._-\s]/g, '_')
}
