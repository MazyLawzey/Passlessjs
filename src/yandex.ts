/**
 * OAuth Token Response Interface
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Yandex OAuth Configuration Interface
 */
export interface YandexOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string;
}

/**
 * Yandex OAuth Helper Class
 */
export class YandexAuth {
  private config: YandexOAuthConfig;

  constructor(config: YandexOAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || 'login:info login:email'
    };
  }

  /**
   * Generate Yandex OAuth authorization URL
   * @returns Authorization URL for Yandex OAuth
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope!
    });

    return `https://oauth.yandex.ru/authorize?${params.toString()}`;
  }

  /**
   * Open Yandex OAuth login in a new window
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
    const tokenEndpoint = 'https://oauth.yandex.ru/token';
    
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
