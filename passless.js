const dotenv = require('dotenv');
const {
	generateRegistrationOptions,
	generateAuthenticationOptions,
	verifyRegistrationResponse,
	verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

dotenv.config();

const defaultConfig = {
	google: {
		clientId: process.env.PASSLESS_GOOGLE_CLIENT_ID,
		clientSecret: process.env.PASSLESS_GOOGLE_CLIENT_SECRET,
		redirectUri: process.env.PASSLESS_GOOGLE_REDIRECT_URI,
	},
	yandex: {
		clientId: process.env.PASSLESS_YANDEX_CLIENT_ID,
		clientSecret: process.env.PASSLESS_YANDEX_CLIENT_SECRET,
		redirectUri: process.env.PASSLESS_YANDEX_REDIRECT_URI,
	},
	passkey: {
		rpName: process.env.PASSLESS_RP_NAME || 'Passless',
		rpId: process.env.PASSLESS_RP_ID,
		origin: process.env.PASSLESS_ORIGIN,
	},
};

class Passless {
	constructor(config = {}) {
		this.config = {
			google: { ...defaultConfig.google, ...(config.google || {}) },
			yandex: { ...defaultConfig.yandex, ...(config.yandex || {}) },
			passkey: { ...defaultConfig.passkey, ...(config.passkey || {}) },
		};

		this.challengeStore = config.challengeStore || new Map(); // challenge -> { userId, createdAt }
		this.credentialStore = config.credentialStore || new Map(); // credentialId -> { userId, publicKey, counter }
	}

	getAuthUrl(provider, state = '') {
		if (provider === 'google') {
			const params = new URLSearchParams({
				client_id: this.config.google.clientId,
				redirect_uri: this.config.google.redirectUri,
				response_type: 'code',
				scope: 'openid email profile',
				access_type: 'offline',
				prompt: 'consent',
				state,
			});
			return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
		}

		if (provider === 'yandex') {
			const params = new URLSearchParams({
				client_id: this.config.yandex.clientId,
				redirect_uri: this.config.yandex.redirectUri,
				response_type: 'code',
				scope: 'login:info login:email',
				state,
			});
			return `https://oauth.yandex.com/authorize?${params.toString()}`;
		}

		throw new Error('Unsupported provider. Use "google" or "yandex".');
	}

	async exchangeCode(provider, code, overrideRedirectUri) {
		if (!code) throw new Error('Authorization code is required.');

		if (provider === 'google') {
			const token = await this.#exchangeOAuthCode({
				tokenEndpoint: 'https://oauth2.googleapis.com/token',
				clientId: this.config.google.clientId,
				clientSecret: this.config.google.clientSecret,
				code,
				redirectUri: overrideRedirectUri || this.config.google.redirectUri,
			});

			const profile = await this.#fetchJson(
				'https://openidconnect.googleapis.com/v1/userinfo',
				token.access_token,
			);

			return { token, profile };
		}

		if (provider === 'yandex') {
			const token = await this.#exchangeOAuthCode({
				tokenEndpoint: 'https://oauth.yandex.com/token',
				clientId: this.config.yandex.clientId,
				clientSecret: this.config.yandex.clientSecret,
				code,
				redirectUri: overrideRedirectUri || this.config.yandex.redirectUri,
			});

			const profile = await this.#fetchJson(
				'https://login.yandex.ru/info?format=json',
				token.access_token,
			);

			return { token, profile };
		}

		throw new Error('Unsupported provider. Use "google" or "yandex".');
	}

	async createPasskeyRegistrationOptions({ userId, username, displayName }) {
		this.#assertPasskeyConfig();
		if (!userId || !username || !displayName) {
			throw new Error('userId, username, and displayName are required.');
		}

		const options = await generateRegistrationOptions({
			rpName: this.config.passkey.rpName,
			rpID: this.config.passkey.rpId,
			userID: String(userId),
			userName: String(username),
			userDisplayName: String(displayName),
			attestationType: 'none',
			excludeCredentials: this.#listCredentialsForUser(userId).map((cred) => ({
				id: cred.credentialID,
				type: 'public-key',
				transports: cred.transports,
			})),
		});

		this.challengeStore.set(options.challenge, { userId, createdAt: Date.now() });
		return options;
	}

	async verifyPasskeyRegistrationResponse({ response, expectedChallenge }) {
		this.#assertPasskeyConfig();
		const challenge = expectedChallenge || response.challenge;
		const record = this.challengeStore.get(challenge) || null;
		if (!challenge || !record) {
			throw new Error('Unknown or expired registration challenge.');
		}

		const verification = await verifyRegistrationResponse({
			response,
			expectedChallenge: challenge,
			expectedOrigin: this.config.passkey.origin,
			expectedRPID: this.config.passkey.rpId,
		});

		if (verification.verified) {
			const { registrationInfo } = verification;
			const credentialID = registrationInfo.credentialID;
			this.credentialStore.set(Buffer.from(credentialID).toString('base64url'), {
				userId: record.userId,
				credentialID,
				credentialPublicKey: registrationInfo.credentialPublicKey,
				counter: registrationInfo.counter,
				transports: response.transports || [],
			});
			this.challengeStore.delete(challenge);
		}

		return verification;
	}

	async createPasskeyAuthenticationOptions({ userId }) {
		this.#assertPasskeyConfig();
		const allowCredentials = this.#listCredentialsForUser(userId).map((cred) => ({
			id: cred.credentialID,
			type: 'public-key',
			transports: cred.transports,
		}));

		const options = await generateAuthenticationOptions({
			rpID: this.config.passkey.rpId,
			allowCredentials,
		});

		this.challengeStore.set(options.challenge, { userId, createdAt: Date.now() });
		return options;
	}

	async verifyPasskeyAuthenticationResponse({ response, expectedChallenge }) {
		this.#assertPasskeyConfig();
		const challenge = expectedChallenge || response.challenge;
		const record = this.challengeStore.get(challenge);
		if (!challenge || !record) {
			throw new Error('Unknown or expired authentication challenge.');
		}

		const credentialIdB64 = response.id || response.rawId;
		const stored = this.credentialStore.get(credentialIdB64);
		if (!stored) {
			throw new Error('Unknown credential.');
		}

		const verification = await verifyAuthenticationResponse({
			response,
			expectedChallenge: challenge,
			expectedOrigin: this.config.passkey.origin,
			expectedRPID: this.config.passkey.rpId,
			credential: {
				id: stored.credentialID,
				publicKey: stored.credentialPublicKey,
				counter: stored.counter,
				transports: stored.transports,
			},
		});

		if (verification.verified) {
			stored.counter = verification.authenticationInfo.newCounter;
			this.credentialStore.set(credentialIdB64, stored);
			this.challengeStore.delete(challenge);
		}

		return verification;
	}

	async #exchangeOAuthCode({ tokenEndpoint, clientId, clientSecret, code, redirectUri }) {
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
		});

		const res = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Token exchange failed (${res.status}): ${text}`);
		}

		return res.json();
	}

	async #fetchJson(url, accessToken) {
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Profile fetch failed (${res.status}): ${text}`);
		}

		return res.json();
	}

	#listCredentialsForUser(userId) {
		return [...this.credentialStore.values()].filter((c) => c.userId === userId);
	}

	#assertPasskeyConfig() {
		if (!this.config.passkey.rpId || !this.config.passkey.origin) {
			throw new Error('Passkey configuration is missing rpId or origin.');
		}
	}
}

const createPassless = (config) => new Passless(config);

module.exports = { Passless, createPassless };