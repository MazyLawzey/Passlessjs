# Passless

A simple and lightweight npm package for authentication with **Google OAuth**, **Yandex OAuth**, and **Passkey (WebAuthn)**.

## Features

- 🔐 **Google OAuth 2.0** authentication
- 🔑 **Yandex OAuth** authentication
- 🎫 **Passkey (WebAuthn)** authentication
- 📦 Lightweight and easy to use
- 💪 Written in TypeScript
- 🌐 Browser-compatible

## Installation

```bash
npm install passless
```

## Usage

### Google OAuth

```typescript
import { GoogleAuth } from 'passless';

// Initialize Google Auth
const googleAuth = new GoogleAuth({
  clientId: 'your-google-client-id',
  redirectUri: 'http://localhost:3000/callback'
});

// Get authorization URL
const authUrl = googleAuth.getAuthorizationUrl();
console.log('Visit:', authUrl);

// Or open login in a new window
googleAuth.login();

// Exchange authorization code for tokens (server-side)
const tokens = await googleAuth.exchangeCodeForToken(code, clientSecret);
```

### Yandex OAuth

```typescript
import { YandexAuth } from 'passless';

// Initialize Yandex Auth
const yandexAuth = new YandexAuth({
  clientId: 'your-yandex-client-id',
  redirectUri: 'http://localhost:3000/callback'
});

// Get authorization URL
const authUrl = yandexAuth.getAuthorizationUrl();
console.log('Visit:', authUrl);

// Or open login in a new window
yandexAuth.login();

// Exchange authorization code for tokens (server-side)
const tokens = await yandexAuth.exchangeCodeForToken(code, clientSecret);
```

### Passkey (WebAuthn)

```typescript
import { PasskeyAuth } from 'passless';

// Initialize Passkey Auth
const passkeyAuth = new PasskeyAuth({
  rpName: 'My App',
  rpId: 'example.com' // Optional, defaults to current domain
});

// Check if passkey is supported
if (passkeyAuth.isSupported()) {
  // Register a new passkey
  const challenge = passkeyAuth.base64ToArrayBuffer('server-generated-challenge');
  const credential = await passkeyAuth.register(
    {
      id: 'user-id',
      name: 'user@example.com',
      displayName: 'User Name'
    },
    challenge
  );

  // Authenticate with existing passkey
  const authCredential = await passkeyAuth.authenticate(challenge);
}
```

## API Reference

### GoogleAuth

#### Constructor
```typescript
new GoogleAuth(config: GoogleOAuthConfig)
```

**GoogleOAuthConfig:**
- `clientId` (string): Your Google OAuth client ID
- `redirectUri` (string): OAuth redirect URI
- `scope` (string, optional): OAuth scopes (default: 'openid profile email')

#### Methods
- `getAuthorizationUrl()`: Returns the Google OAuth authorization URL
- `login()`: Opens Google OAuth login in a new window
- `exchangeCodeForToken(code, clientSecret)`: Exchanges authorization code for tokens

### YandexAuth

#### Constructor
```typescript
new YandexAuth(config: YandexOAuthConfig)
```

**YandexOAuthConfig:**
- `clientId` (string): Your Yandex OAuth client ID
- `redirectUri` (string): OAuth redirect URI
- `scope` (string, optional): OAuth scopes (default: 'login:info login:email')

#### Methods
- `getAuthorizationUrl()`: Returns the Yandex OAuth authorization URL
- `login()`: Opens Yandex OAuth login in a new window
- `exchangeCodeForToken(code, clientSecret)`: Exchanges authorization code for tokens

### PasskeyAuth

#### Constructor
```typescript
new PasskeyAuth(config: PasskeyConfig)
```

**PasskeyConfig:**
- `rpName` (string): Relying Party name (your app name)
- `rpId` (string, optional): Relying Party ID (usually your domain)
- `userVerification` (UserVerificationRequirement, optional): User verification requirement
- `authenticatorAttachment` (AuthenticatorAttachment, optional): Authenticator attachment preference

#### Methods
- `isSupported()`: Checks if WebAuthn is supported in the browser
- `register(user, challenge)`: Registers a new passkey
- `authenticate(challenge, allowCredentials?)`: Authenticates with an existing passkey
- `arrayBufferToBase64(buffer)`: Converts ArrayBuffer to Base64 string
- `base64ToArrayBuffer(base64)`: Converts Base64 string to ArrayBuffer

## Example: Complete Login Flow

```typescript
import { GoogleAuth, YandexAuth, PasskeyAuth } from 'passless';

// Setup all auth methods
const googleAuth = new GoogleAuth({
  clientId: 'your-google-client-id',
  redirectUri: 'http://localhost:3000/callback'
});

const yandexAuth = new YandexAuth({
  clientId: 'your-yandex-client-id',
  redirectUri: 'http://localhost:3000/callback'
});

const passkeyAuth = new PasskeyAuth({
  rpName: 'My Awesome App'
});

// Use in your app
document.getElementById('google-login')?.addEventListener('click', () => {
  googleAuth.login();
});

document.getElementById('yandex-login')?.addEventListener('click', () => {
  yandexAuth.login();
});

document.getElementById('passkey-register')?.addEventListener('click', async () => {
  if (passkeyAuth.isSupported()) {
    // Get challenge from your server
    const challenge = await fetch('/api/challenge').then(r => r.text());
    const credential = await passkeyAuth.register(
      {
        id: 'user-123',
        name: 'user@example.com',
        displayName: 'John Doe'
      },
      passkeyAuth.base64ToArrayBuffer(challenge)
    );
    // Send credential to server for verification
  }
});
```

## Browser Support

- **Google OAuth**: All modern browsers
- **Yandex OAuth**: All modern browsers
- **Passkey (WebAuthn)**: Chrome 67+, Firefox 60+, Safari 14+, Edge 18+

## Security Notes

- **Never expose client secrets** in client-side code
- The `exchangeCodeForToken` methods should only be called from your backend server
- Always validate tokens on your server before trusting them
- For Passkey, always generate challenges on the server with sufficient randomness
- Use HTTPS in production for all authentication flows

## License

MIT © Mazy Lawzey

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub issue tracker](https://github.com/MazyLawzey/passless/issues).

