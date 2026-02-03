import { NextRequest, NextResponse } from 'next/server'
import { getFinAPIClient } from '@/lib/finapi-client'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/bank-connections/callback
 * OAuth callback after user connects bank
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const error = searchParams.get('error')

    // Handle error from finAPI
    if (error) {
      const errorDescription = searchParams.get('error_description')
      console.error('OAuth error:', error, errorDescription)

      // Redirect to settings with error
      const redirectUrl = new URL('/settings', request.url)
      redirectUrl.searchParams.set('error', 'connection_failed')
      redirectUrl.searchParams.set('message', errorDescription || error)

      return NextResponse.redirect(redirectUrl)
    }

    // Get user tokens (from state or session)
    // For simplicity, we'll fetch them again
    const finapiClient = getFinAPIClient()

    const userId = 'bridge-acc-user-1'
    const password = process.env.FINAPI_USER_PASSWORD || 'secure_password_123'

    const tokenResponse = await finapiClient.getUserToken(userId, password)

    // Get bank connections
    const connections = await finapiClient.getBankConnections(tokenResponse.access_token)

    if (connections.length === 0) {
      // No connections found
      const redirectUrl = new URL('/settings', request.url)
      redirectUrl.searchParams.set('error', 'no_connections')
      redirectUrl.searchParams.set('message', 'No bank accounts found')

      return NextResponse.redirect(redirectUrl)
    }

    // Save each connection to database
    for (const connection of connections) {
      // Check if bank account already exists
      let bankAccount = await prisma.bankAccount.findFirst({
        where: {
          iban: connection.iban || undefined,
        },
      })

      if (!bankAccount) {
        // Create new bank account
        bankAccount = await prisma.bankAccount.create({
          data: {
            bankName: 'Vivid Money',
            accountName: connection.name || 'Connected Account',
            iban: connection.iban || null,
            balance: connection.balance || 0,
            currency: connection.currency || 'EUR',
          },
        })
      }

      // Check if connection already exists
      const existingConnection = await prisma.bankConnection.findUnique({
        where: {
          bankAccountId: bankAccount.id,
        },
      })

      const encryptedAccessToken = encrypt(tokenResponse.access_token)
      const encryptedRefreshToken = encrypt(tokenResponse.refresh_token)
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

      if (existingConnection) {
        // Update existing connection
        await prisma.bankConnection.update({
          where: {
            id: existingConnection.id,
          },
          data: {
            status: 'active',
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: expiresAt,
            externalAccountId: connection.id.toString(),
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          },
        })
      } else {
        // Create new connection
        await prisma.bankConnection.create({
          data: {
            bankName: 'Vivid Money',
            connectionType: 'api',
            status: 'active',
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: expiresAt,
            externalAccountId: connection.id.toString(),
            bankAccountId: bankAccount.id,
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          },
        })
      }
    }

    // Redirect to settings with success
    const redirectUrl = new URL('/settings', request.url)
    redirectUrl.searchParams.set('success', 'true')
    redirectUrl.searchParams.set('message', `${connections.length}개 계좌가 연결되었습니다`)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error in OAuth callback:', error)

    // Redirect to settings with error
    const redirectUrl = new URL('/settings', request.url)
    redirectUrl.searchParams.set('error', 'callback_failed')
    redirectUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Unknown error'
    )

    return NextResponse.redirect(redirectUrl)
  }
}
