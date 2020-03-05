# SpeedUP SMS notification

SMS notification using [SMS.ir](https://www.sms.ir) provider.

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

## Installation

```sh

# NPM
npm i @speedup/notification-sms-smsir --save

# Yarn
yarn install @speedup/notification-sms-smsir

```

## Usage

```js

const SMSSender = require('@speedup/notification-sms-smsir');

const sms = new SMSSender({
    apiKey: 'your-api-key',
    secret: 'api-key-secret'
});

await sms.send('09123456780', 'Thanks for choosing us!', {
    lineNumber: '30001234',
    sendDateTime: '', // means immediately
    canContinueInCaseOfError: true
});

```

And you're good to go!

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@speedup/notification-sms-smsir.svg?color=orange
[npm-url]: https://npmjs.org/package/@speedup/notification-sms-smsir
[downloads-image]: https://img.shields.io/npm/dt/@speedup/notification-sms-smsir.svg
[downloads-url]: https://npmjs.org/package/@speedup/notification-sms-smsir