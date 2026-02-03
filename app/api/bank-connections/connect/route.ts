import { NextResponse } from 'next/server'
import { getFinAPIClient } from '@/lib/finapi-client'
import { encrypt } from '@/lib/encryption'

/**
 * POST /api/bank-connections/connect
 * Start OAuth flow to connect bank
 */
export async function POST() {
  try {
    // Check if finAPI is configured
    if (!process.env.FINAPI_CLIENT_ID || !process.env.FINAPI_CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'finAPI not configured',
          message: 'finAPI credentials are missing. Please configure FINAPI_CLIENT_ID and FINAPI_CLIENT_SECRET in .env.local',
        },
        { status: 500 }
      )
    }

    const finapiClient = getFinAPIClient()

    // Step 1: Get client token
    const clientToken = await finapiClient.getClientToken()

    // Step 2: Create/get finAPI user
    // For single-user app, we use a fixed user ID
    const userId = 'bridge-acc-user-1'
    const password = process.env.FINAPI_USER_PASSWORD || 'secure_password_123'

    await finapiClient.createUser(userId, password, clientToken)

    // Step 3: Get user token
    const tokenResponse = await finapiClient.getUserToken(userId, password)

    // Step 4: Get Web Form URL for bank connection
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/bank-connections/callback`

    const webFormUrl = await finapiClient.getWebFormUrl(
      tokenResponse.access_token,
      callbackUrl
    )

    // Store tokens temporarily (in production, use session or database)
    // For now, we'll return them and handle in callback
    const encryptedAccessToken = encrypt(tokenResponse.access_token)
    const encryptedRefreshToken = encrypt(tokenResponse.refresh_token)

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    return NextResponse.json({
      success: true,
      data: {
        webFormUrl,
        tokens: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: expiresAt.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Error starting bank connection:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start bank connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
