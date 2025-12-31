/**
 * OAuth Token Response Interface
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
  scope?: string;
}

/**
 * Google OAuth Configuration Interface
 */
export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string;
}

/**
 * Google OAuth Helper Class
 */
export class GoogleAuth {
  private config: GoogleOAuthConfig;

  constructor(config: GoogleOAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || 'openid profile email'
    };
  }

  /**
   * Generate Google OAuth authorization URL
   * @returns Authorization URL for Google OAuth
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope!,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Open Google OAuth login in a new window
   */
  login(): void {
    const authUrl = this.getAuthorizationUrl();
    window.open(authUrl, '_blank', 'width=500,height=600');
  }

  /**
   * Exchange authorization code for tokens (server-side)
   * Note: This should be done on the server-side with client secret
   * @param code Authorization code
   * @param clientSecret Client secret
   * @returns Promise with token response
   */
  async exchangeCodeForToken(code: string, clientSecret: string): Promise<OAuthTokenResponse> {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const params = new URLSearchParams({
      code: code,
      client_id: this.config.clientId,
      client_secret: clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    return response.json();
  }
}
