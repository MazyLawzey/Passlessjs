/**
 * Passless - A simple npm package for authentication with Google, Yandex, and Passkey (WebAuthn)
 */

export { GoogleAuth, GoogleOAuthConfig, OAuthTokenResponse as GoogleOAuthTokenResponse } from './google';
export { YandexAuth, YandexOAuthConfig, OAuthTokenResponse as YandexOAuthTokenResponse } from './yandex';
export { PasskeyAuth, PasskeyConfig, PasskeyUser } from './passkey';

import { GoogleAuth } from './google';
import { YandexAuth } from './yandex';
import { PasskeyAuth } from './passkey';

// Default export for convenience
export default {
  GoogleAuth,
  YandexAuth,
  PasskeyAuth
};
