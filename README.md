# passless - English 🇺🇸

A mini-library for Node.js that makes it easy to integrate OAuth login via Google and Yandex, as well as add Passkey (WebAuthn) authentication. Configuration is done via `.env`, with no unnecessary magic.

## Installation

```bash
npm install passlessjs
```

Requires Node.js 18+ (uses the built-in `fetch`).

## Environment Variables

Create a `.env` file (see `.env.example`):

```
PASSLESS_GOOGLE_CLIENT_ID=
PASSLESS_GOOGLE_CLIENT_SECRET=
PASSLESS_GOOGLE_REDIRECT_URI=
PASSLESS_YANDEX_CLIENT_ID=
PASSLESS_YANDEX_CLIENT_SECRET=
PASSLESS_YANDEX_REDIRECT_URI=
PASSLESS_RP_NAME=Passless Demo
PASSLESS_RP_ID=localhost
PASSLESS_ORIGIN=http://localhost:3000
```

## Quick Start (OAuth)

```js
const express = require('express');
const { Passless } = require('passlessjs');
require('dotenv').config();

const app = express();
const passless = new Passless();

app.get('/auth/google', (req, res) => {
  const url = passless.getAuthUrl('google', req.query.state || '');
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const result = await passless.exchangeCode('google', code);
  // result.token and result.profile
  res.json(result.profile);
});

app.get('/auth/yandex', (req, res) => {
  const url = passless.getAuthUrl('yandex', req.query.state || '');
  res.redirect(url);
});

app.get('/auth/yandex/callback', async (req, res) => {
  const { code } = req.query;
  const result = await passless.exchangeCode('yandex', code);
  res.json(result.profile);
});

app.listen(3000, () => console.log('http://localhost:3000'));
```

## Passkey (WebAuthn) Example

In a real project, replace `Map` with your database. Store `credentialStore` and `challengeStore` between restarts.

```js
const passless = new Passless({
  passkey: {
    rpId: 'localhost',
    origin: 'http://localhost:3000',
    rpName: 'Passless Demo',
  },
  credentialStore: new Map(),
  challengeStore: new Map(),
});

// Registration
app.get('/passkey/register/options', async (req, res) => {
  const opts = await passless.createPasskeyRegistrationOptions({
    userId: '123',
    username: 'demo',
    displayName: 'Demo User',
  });
  res.json(opts);
});

app.post('/passkey/register/verify', express.json(), async (req, res) => {
  const verification = await passless.verifyPasskeyRegistrationResponse({
    response: req.body,
    expectedChallenge: req.body.expectedChallenge,
  });
  res.json({ verified: verification.verified });
});

// Authentication
app.get('/passkey/authn/options', async (req, res) => {
  const opts = await passless.createPasskeyAuthenticationOptions({ userId: '123' });
  res.json(opts);
});

app.post('/passkey/authn/verify', express.json(), async (req, res) => {
  const verification = await passless.verifyPasskeyAuthenticationResponse({
    response: req.body,
    expectedChallenge: req.body.expectedChallenge,
  });
  res.json({ verified: verification.verified });
});
```

## API Overview

* `new Passless(config?)` — accepts `google`, `yandex`, `passkey`, as well as custom `credentialStore`/`challengeStore` (default is `Map`).
* `getAuthUrl(provider, state?)` — returns the authorization URL (`provider`: `google` | `yandex`).
* `exchangeCode(provider, code, overrideRedirectUri?)` — exchange `code` for a token and profile.
* `createPasskeyRegistrationOptions({ userId, username, displayName })` — get options for WebAuthn registration.
* `verifyPasskeyRegistrationResponse({ response, expectedChallenge })` — verify the registration response.
* `createPasskeyAuthenticationOptions({ userId })` — options for passkey login.
* `verifyPasskeyAuthenticationResponse({ response, expectedChallenge })` — verify the authentication response.

## Limitations

* The examples use in-memory stores; replace them with a persistent database.
* For production, add checks for the expiration of `state`/`challenge` and use HTTPS.
* Ensure that `PASSLESS_ORIGIN` and `PASSLESS_RP_ID` match the real domain.

### Extensibility

Passless uses a provider-based architecture. Any OAuth2 provider (Apple, GitHub, Discord, etc.) can be added without changing the core.

### Pull Requests

I welcome any contributions!



# passless - Ru 🇷🇺

Мини-библиотека для Node.js, которая помогает быстро подружиться с OAuth входом через Google и Yandex, а также добавить вход по Passkey (WebAuthn). Конфигурация через `.env`, без лишней магии.

## Установка

```bash
npm install passlessjs
```

Требуется Node.js 18+ (используется встроенный `fetch`).

## Переменные окружения

Создайте файл `.env` (см. `.env.example`):

```
PASSLESS_GOOGLE_CLIENT_ID=
PASSLESS_GOOGLE_CLIENT_SECRET=
PASSLESS_GOOGLE_REDIRECT_URI=
PASSLESS_YANDEX_CLIENT_ID=
PASSLESS_YANDEX_CLIENT_SECRET=
PASSLESS_YANDEX_REDIRECT_URI=
PASSLESS_RP_NAME=Passless Demo
PASSLESS_RP_ID=localhost
PASSLESS_ORIGIN=http://localhost:3000
```

## Быстрый старт (OAuth)

```js
const express = require('express');
const { Passless } = require('passlessjs');
require('dotenv').config();

const app = express();
const passless = new Passless();

app.get('/auth/google', (req, res) => {
  const url = passless.getAuthUrl('google', req.query.state || '');
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const result = await passless.exchangeCode('google', code);
  // result.token и result.profile
  res.json(result.profile);
});

app.get('/auth/yandex', (req, res) => {
  const url = passless.getAuthUrl('yandex', req.query.state || '');
  res.redirect(url);
});

app.get('/auth/yandex/callback', async (req, res) => {
  const { code } = req.query;
  const result = await passless.exchangeCode('yandex', code);
  res.json(result.profile);
});

app.listen(3000, () => console.log('http://localhost:3000'));
```

## Passkey (WebAuthn) пример

В реальном проекте замените `Map` на свою БД. Храните `credentialStore` и `challengeStore` между перезапусками.

```js
const passless = new Passless({
  passkey: {
    rpId: 'localhost',
    origin: 'http://localhost:3000',
    rpName: 'Passless Demo',
  },
  credentialStore: new Map(),
  challengeStore: new Map(),
});

// Регистрация
app.get('/passkey/register/options', async (req, res) => {
  const opts = await passless.createPasskeyRegistrationOptions({
    userId: '123',
    username: 'demo',
    displayName: 'Demo User',
  });
  res.json(opts);
});

app.post('/passkey/register/verify', express.json(), async (req, res) => {
  const verification = await passless.verifyPasskeyRegistrationResponse({
    response: req.body,
    expectedChallenge: req.body.expectedChallenge,
  });
  res.json({ verified: verification.verified });
});

// Аутентификация
app.get('/passkey/authn/options', async (req, res) => {
  const opts = await passless.createPasskeyAuthenticationOptions({ userId: '123' });
  res.json(opts);
});

app.post('/passkey/authn/verify', express.json(), async (req, res) => {
  const verification = await passless.verifyPasskeyAuthenticationResponse({
    response: req.body,
    expectedChallenge: req.body.expectedChallenge,
  });
  res.json({ verified: verification.verified });
});
```

## API поверхностно

- `new Passless(config?)` — принимает `google`, `yandex`, `passkey`, а также свои `credentialStore`/`challengeStore` (по умолчанию `Map`).
- `getAuthUrl(provider, state?)` — вернуть URL авторизации (`provider`: `google` | `yandex`).
- `exchangeCode(provider, code, overrideRedirectUri?)` — обменять `code` на токен и профиль.
- `createPasskeyRegistrationOptions({ userId, username, displayName })` — получить options для WebAuthn регистрации.
- `verifyPasskeyRegistrationResponse({ response, expectedChallenge })` — проверить ответ регистрации.
- `createPasskeyAuthenticationOptions({ userId })` — options для входа по passkey.
- `verifyPasskeyAuthenticationResponse({ response, expectedChallenge })` — проверить ответ входа.


## Ограничения

- В примерах используются in-memory хранилища; замените на постоянную БД.
- Для продакшена добавьте проверку срока жизни `state`/`challenge` и HTTPS.
- Следите, чтобы `PASSLESS_ORIGIN` и `PASSLESS_RP_ID` совпадали с реальным доменом.

### Расширяемость
Passless использует провайдерную архитектуру. Любой OAuth2-провайдер
(Apple, GitHub, Discord и др.) может быть добавлен без изменения ядра.

### Pull requests
буду рад видеть любые запросы
