import { put, del, list } from '@vercel/blob';

/**
 * 파일을 Vercel Blob에 업로드
 * @param file File 객체 (브라우저) 또는 Buffer (서버)
 * @param filename 저장할 파일명
 * @param folder 폴더 경로 (선택)
 * @returns 업로드된 파일의 URL
 */
export async function uploadFile(
  file: File | Buffer,
  filename: string,
  folder?: string
): Promise<{ url: string; pathname: string }> {
  const pathname = folder ? `${folder}/${filename}` : filename;

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true, // 파일명 중복 방지
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

/**
 * Vercel Blob에서 파일 삭제
 * @param url 삭제할 파일의 URL
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * 특접 폴더의 파일 목록 조회
 * @param prefix 폴더 경로
 */
export async function listFiles(prefix?: string) {
  const { blobs } = await list({
    prefix: prefix || '',
  });

  return blobs;
}

/**
 * 거래 첨부파일 업로드 (TransactionAttachment용)
 */
export async function uploadTransactionAttachment(
  file: File,
  transactionId: string
): Promise<{ url: string; pathname: string; fileName: string; fileSize: number; mimeType: string }> {
  const folder = `transactions/${transactionId}`;
  const { url, pathname } = await uploadFile(file, file.name, folder);

  return {
    url,
    pathname,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
