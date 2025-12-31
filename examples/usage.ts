/**
 * Example usage of the passless library
 * 
 * This file demonstrates how to use the Google, Yandex, and Passkey authentication methods.
 */

import { GoogleAuth, YandexAuth, PasskeyAuth } from '../src/index';

// ===== Google OAuth Example =====
console.log('=== Google OAuth Example ===');

const googleAuth = new GoogleAuth({
  clientId: 'your-google-client-id.apps.googleusercontent.com',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'openid profile email'
});

// Get the authorization URL
const googleAuthUrl = googleAuth.getAuthorizationUrl();
console.log('Google Auth URL:', googleAuthUrl);

// In a browser environment, you can use:
// googleAuth.login(); // This will open a popup window

// After user authorizes, you'll receive a code in your redirect URI
// Exchange the code for tokens (server-side only!)
// const tokens = await googleAuth.exchangeCodeForToken(code, 'your-client-secret');

// ===== Yandex OAuth Example =====
console.log('\n=== Yandex OAuth Example ===');

const yandexAuth = new YandexAuth({
  clientId: 'your-yandex-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'login:info login:email'
});

// Get the authorization URL
const yandexAuthUrl = yandexAuth.getAuthorizationUrl();
console.log('Yandex Auth URL:', yandexAuthUrl);

// In a browser environment, you can use:
// yandexAuth.login(); // This will open a popup window

// After user authorizes, you'll receive a code in your redirect URI
// Exchange the code for tokens (server-side only!)
// const tokens = await yandexAuth.exchangeCodeForToken(code, 'your-client-secret');

// ===== Passkey (WebAuthn) Example =====
console.log('\n=== Passkey (WebAuthn) Example ===');

const passkeyAuth = new PasskeyAuth({
  rpName: 'My Awesome App',
  rpId: 'example.com', // Optional: defaults to current domain
  userVerification: 'preferred'
});

// Check if WebAuthn is supported (browser only)
// if (passkeyAuth.isSupported()) {
//   console.log('Passkey is supported!');
  
//   // Register a new passkey
//   // The challenge should come from your server
//   const challenge = new Uint8Array(32);
//   crypto.getRandomValues(challenge); // Generate random challenge
  
//   try {
//     const credential = await passkeyAuth.register(
//       {
//         id: 'user-123',
//         name: 'user@example.com',
//         displayName: 'John Doe'
//       },
//       challenge.buffer
//     );
    
//     console.log('Passkey registered:', credential);
    
//     // Send credential to server for storage
//     // You need to store the credential ID and public key on your server
    
//     // Later, to authenticate:
//     const authCredential = await passkeyAuth.authenticate(challenge.buffer);
//     console.log('Authentication successful:', authCredential);
    
//   } catch (error) {
//     console.error('Passkey error:', error);
//   }
// } else {
//   console.log('Passkey is not supported in this environment');
// }

// ===== Complete Example: Handling Callback =====
console.log('\n=== Handling OAuth Callback ===');

// After the user completes OAuth authentication, they'll be redirected back
// to your redirect URI with a code parameter. Here's how to handle it:

/*
// On your server (e.g., Express.js):
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // For Google
    const googleAuth = new GoogleAuth({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      redirectUri: 'http://localhost:3000/callback'
    });
    
    const tokens = await googleAuth.exchangeCodeForToken(
      code,
      process.env.GOOGLE_CLIENT_SECRET!
    );
    
    // tokens contains: access_token, refresh_token, id_token, etc.
    // Use the access_token to fetch user info
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    );
    
    const userInfo = await userInfoResponse.json();
    console.log('User info:', userInfo);
    
    // Create session, JWT, etc.
    res.json({ success: true, user: userInfo });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
*/

console.log('\nFor more examples, see the examples/ directory');
