/**
 * Passkey (WebAuthn) Configuration Interface
 */
export interface PasskeyConfig {
  rpName: string; // Relying Party Name
  rpId?: string; // Relying Party ID (usually domain)
  userVerification?: UserVerificationRequirement;
  authenticatorAttachment?: AuthenticatorAttachment;
}

/**
 * User Information for Passkey Registration
 */
export interface PasskeyUser {
  id: string;
  name: string;
  displayName: string;
}

/**
 * Passkey (WebAuthn) Helper Class
 */
export class PasskeyAuth {
  private config: PasskeyConfig;

  constructor(config: PasskeyConfig) {
    this.config = {
      rpId: window.location.hostname,
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
      ...config
    };
  }

  /**
   * Check if WebAuthn is supported in the browser
   * @returns true if WebAuthn is supported
   */
  isSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      navigator.credentials.create
    );
  }

  /**
   * Register a new passkey (credential)
   * @param user User information
   * @param challenge Server-generated challenge (should be random bytes)
   * @returns Promise with credential
   */
  async register(user: PasskeyUser, challenge: ArrayBuffer): Promise<PublicKeyCredential | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: this.config.rpName,
        id: this.config.rpId
      },
      user: {
        id: new TextEncoder().encode(user.id),
        name: user.name,
        displayName: user.displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: this.config.authenticatorAttachment,
        userVerification: this.config.userVerification,
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: 'direct'
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential | null;

      return credential;
    } catch (error) {
      throw new Error(`Passkey registration failed: ${error}`);
    }
  }

  /**
   * Authenticate with an existing passkey
   * @param challenge Server-generated challenge (should be random bytes)
   * @param allowCredentials Optional list of credential IDs to allow
   * @returns Promise with credential
   */
  async authenticate(
    challenge: ArrayBuffer,
    allowCredentials?: PublicKeyCredentialDescriptor[]
  ): Promise<PublicKeyCredential | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge,
      rpId: this.config.rpId,
      allowCredentials: allowCredentials,
      userVerification: this.config.userVerification,
      timeout: 60000
    };

    try {
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential | null;

      return credential;
    } catch (error) {
      throw new Error(`Passkey authentication failed: ${error}`);
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string (for sending to server)
   * @param buffer ArrayBuffer to convert
   * @returns Base64 string
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binaryChars = Array.from(bytes, byte => String.fromCharCode(byte));
    return btoa(binaryChars.join(''));
  }

  /**
   * Convert Base64 string to ArrayBuffer (for receiving from server)
   * @param base64 Base64 string
   * @returns ArrayBuffer
   */
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
