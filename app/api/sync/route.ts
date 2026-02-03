import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFinAPIClient } from '@/lib/finapi-client'
import { decrypt } from '@/lib/encryption'
import { checkBatchDuplicates } from '@/lib/duplicate-checker'
import { subMonths } from 'date-fns'

/**
 * POST /api/sync
 * Sync transactions from bank API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, fromDate } = body

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'connectionId is required',
        },
        { status: 400 }
      )
    }

    // Get bank connection
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      include: {
        bankAccount: true,
      },
    })

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bank connection not found',
        },
        { status: 404 }
      )
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Bank connection is not active',
        },
        { status: 400 }
      )
    }

    if (connection.connectionType !== 'api') {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection type is not API',
        },
        { status: 400 }
      )
    }

    // Decrypt tokens
    let accessToken: string
    let refreshToken: string

    try {
      accessToken = connection.accessToken ? decrypt(connection.accessToken) : ''
      refreshToken = connection.refreshToken ? decrypt(connection.refreshToken) : ''
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decrypt tokens. Please reconnect your bank.',
        },
        { status: 500 }
      )
    }

    // Check if token is expired
    const now = new Date()
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < now) {
      // Try to refresh token
      try {
        const finapiClient = getFinAPIClient()
        const newTokens = await finapiClient.refreshToken(refreshToken)

        // Update tokens in database
        const { encrypt } = await import('@/lib/encryption')
        await prisma.bankConnection.update({
          where: { id: connectionId },
          data: {
            accessToken: encrypt(newTokens.access_token),
            refreshToken: encrypt(newTokens.refresh_token),
            tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
          },
        })

        accessToken = newTokens.access_token
      } catch {
        await prisma.bankConnection.update({
          where: { id: connectionId },
          data: {
            status: 'error',
            lastSyncStatus: 'error',
            lastSyncError: 'Token refresh failed. Please reconnect.',
          },
        })

        return NextResponse.json(
          {
            success: false,
            error: 'Token expired and refresh failed. Please reconnect your bank.',
          },
          { status: 401 }
        )
      }
    }

    if (!connection.externalAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'External account ID not found',
        },
        { status: 400 }
      )
    }

    // Fetch transactions from finAPI
    const finapiClient = getFinAPIClient()

    // Determine date range
    const toDate = new Date().toISOString().split('T')[0]
    let startDate: string

    if (fromDate) {
      startDate = fromDate
    } else if (connection.lastSyncAt) {
      // Sync from last sync date
      startDate = connection.lastSyncAt.toISOString().split('T')[0]
    } else {
      // First sync: get last 3 months
      startDate = subMonths(new Date(), 3).toISOString().split('T')[0]
    }

    let apiTransactions
    try {
      apiTransactions = await finapiClient.getTransactions(
        accessToken,
        parseInt(connection.externalAccountId),
        startDate,
        toDate
      )
    } catch (error: unknown) {
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncStatus: 'error',
          lastSyncError: error instanceof Error ? error.message : 'Failed to fetch transactions',
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch transactions from bank',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    // Transform API transactions to our format
    const transactions = apiTransactions.map((tx) => ({
      externalId: tx.id.toString(),
      date: new Date(tx.valueDate || tx.bankBookingDate),
      amount: tx.amount,
      description: tx.purpose || 'No description',
      counterparty: tx.counterpartName || null,
    }))

    // Check for duplicates
    const duplicateMap = await checkBatchDuplicates(
      connection.bankAccountId,
      transactions.map((tx) => ({
        externalId: tx.externalId,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
      }))
    )

    // Filter out duplicates
    const newTransactions = transactions.filter((_, index) => !duplicateMap.get(index))

    // Insert new transactions
    let importedCount = 0
    if (newTransactions.length > 0) {
      await prisma.$transaction(
        newTransactions.map((tx) =>
          prisma.transaction.create({
            data: {
              bankAccountId: connection.bankAccountId,
              source: 'api',
              externalId: tx.externalId,
              date: tx.date,
              amount: tx.amount,
              currency: 'EUR',
              description: tx.description,
              counterparty: tx.counterparty,
            },
          })
        )
      )
      importedCount = newTransactions.length
    }

    // Update connection sync status
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        total: apiTransactions.length,
        imported: importedCount,
        duplicates: apiTransactions.length - importedCount,
        dateRange: {
          from: startDate,
          to: toDate,
        },
      },
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
