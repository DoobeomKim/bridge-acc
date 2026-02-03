import axios, { AxiosInstance } from 'axios'

/**
 * finAPI Client for Vivid Money
 * Documentation: https://oba.prime.vivid.money/api-docs/index.html
 */

interface FinAPIConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
}

interface BankConnection {
  id: number
  bankId: number
  name: string
  iban: string
  accountTypeId: number
  balance: number
  currency: string
}

interface Transaction {
  id: number
  accountId: number
  valueDate: string
  bankBookingDate: string
  amount: number
  purpose: string
  counterpartName: string | null
  counterpartIban: string | null
  type: string
}

export class FinAPIClient {
  private client: AxiosInstance
  private config: FinAPIConfig

  constructor(config: FinAPIConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Get client access token (for app-level operations)
   */
  async getClientToken(): Promise<string> {
    try {
      const response = await this.client.post<TokenResponse>(
        '/oauth/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data.access_token
    } catch (error) {
      console.error('Error getting client token:', error)
      throw new Error('Failed to authenticate with finAPI')
    }
  }

  /**
   * Create a new finAPI user
   */
  async createUser(userId: string, password: string, clientToken: string): Promise<void> {
    try {
      await this.client.post(
        '/api/v1/users',
        {
          id: userId,
          password: password,
          email: `${userId}@bridge-acc.local`, // Optional
          isAutoUpdateEnabled: true,
        },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
          },
        }
      )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // User might already exist, that's okay
      if (error.response?.status !== 409) {
        throw error
      }
    }
  }

  /**
   * Get user access token
   */
  async getUserToken(userId: string, password: string): Promise<TokenResponse> {
    try {
      const response = await this.client.post<TokenResponse>(
        '/oauth/token',
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          username: userId,
          password: password,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Error getting user token:', error)
      throw new Error('Failed to get user access token')
    }
  }

  /**
   * Get Web Form URL for bank connection
   * This opens a form where user can connect their bank
   */
  async getWebFormUrl(userToken: string, redirectUrl: string): Promise<string> {
    try {
      const response = await this.client.post(
        '/api/v1/webForms/bankConnectionImport',
        {
          callbackUrl: redirectUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      )

      return response.data.url
    } catch (error) {
      console.error('Error getting web form URL:', error)
      throw new Error('Failed to create bank connection form')
    }
  }

  /**
   * Get all bank connections for a user
   */
  async getBankConnections(userToken: string): Promise<BankConnection[]> {
    try {
      const response = await this.client.get('/api/v1/accounts', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      return response.data.accounts || []
    } catch (error) {
      console.error('Error getting bank connections:', error)
      throw new Error('Failed to fetch bank connections')
    }
  }

  /**
   * Get transactions for an account
   */
  async getTransactions(
    userToken: string,
    accountId: number,
    fromDate?: string,
    toDate?: string
  ): Promise<Transaction[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        accountIds: accountId,
        view: 'bankView', // Get original bank data
      }

      if (fromDate) params.minBankBookingDate = fromDate
      if (toDate) params.maxBankBookingDate = toDate

      const response = await this.client.get('/api/v1/transactions', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        params,
      })

      return response.data.transactions || []
    } catch (error) {
      console.error('Error getting transactions:', error)
      throw new Error('Failed to fetch transactions')
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await this.client.post<TokenResponse>(
        '/oauth/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh access token')
    }
  }

  /**
   * Trigger bank connection update (sync)
   */
  async updateBankConnection(userToken: string, connectionId: number): Promise<void> {
    try {
      await this.client.post(
        `/api/v1/bankConnections/update`,
        {
          bankConnectionId: connectionId,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      )
    } catch (error) {
      console.error('Error updating bank connection:', error)
      throw new Error('Failed to update bank connection')
    }
  }
}

/**
 * Get finAPI client instance
 */
export function getFinAPIClient(): FinAPIClient {
  const clientId = process.env.FINAPI_CLIENT_ID
  const clientSecret = process.env.FINAPI_CLIENT_SECRET
  const baseUrl = process.env.FINAPI_BASE_URL || 'https://oba.prime.vivid.money'

  if (!clientId || !clientSecret) {
    throw new Error('finAPI credentials not configured. Please set FINAPI_CLIENT_ID and FINAPI_CLIENT_SECRET in .env.local')
  }

  return new FinAPIClient({
    clientId,
    clientSecret,
    baseUrl,
  })
}
