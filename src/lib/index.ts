/**
 * SMS sender
 */

import Axios, { AxiosInstance } from 'axios';
import ms from 'ms';

import ISendConfig from './interfaces/ISendConfig';
import ISenderConfig from './interfaces/ISenderConfig';
import ISendResult from './interfaces/ISendResult';

const AUTH_TOKEN_HEADER_KEY = 'x-sms-ir-secure-token';
const DEFAULT_AUTH_TIMEOUT = '30m'; // default is 30 minutes

class SMSSender {

    /**
     * HTTP client
     */
    protected readonly httpClient: AxiosInstance;

    /**
     * Configuration
     */
    protected config: ISenderConfig;

    /**
     * Authentication information
     */
    protected readonly cache = {

        /**
         * Current credit
         */
        credit: 0,

        /**
         * Last authentication retry
         */
        lastAuthRetry: 0,

        /**
         * Current authentication token
         */
        authToken: ''
    };

    constructor(config?: ISenderConfig) {

        if (!config) {
            throw new Error('config cannot be null or empty');
        }

        this.config = config;

        this.httpClient = Axios.create({
            baseURL: 'https://restfulsms.com/api',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: ms('10s')
        });
    }

    /**
     * Renew the authentication token
     */
    protected async renewToken(): Promise<void> {

        // not reached the threshold
        if (Date.now() - this.cache.lastAuthRetry < ms(this.config.authTimeout || DEFAULT_AUTH_TIMEOUT)) { return; }

        // perform the request
        const authResponse = await this.httpClient.post('/Token',
            {
                UserApiKey: this.config.apiKey,
                SecretKey: this.config.secret
            },
            {
                validateStatus: (status: number) => status === 201
            }
        );

        if (!authResponse.data.IsSuccessful) {
            throw new Error(`Invalid response: ${authResponse.data.Message}`);
        }

        // attach token & update the interval
        this.cache.authToken = authResponse.data.TokenKey;
        this.cache.lastAuthRetry = Date.now();
    }

    /**
     * Retrieve current balance
     */
    protected async currentBalance(): Promise<number> {

        // renew token
        await this.renewToken();

        // perform the request
        const balanceResponse = await this.httpClient.get('/credit', {
            headers: {
                [AUTH_TOKEN_HEADER_KEY]: this.cache.authToken
            },
            validateStatus: (status: number) => status === 201
        });

        if (!balanceResponse.data.IsSuccessful) {
            throw new Error(`Invalid response: ${balanceResponse.data.Message}`);
        }

        this.cache.credit = balanceResponse.data.Credit;

        return this.cache.credit;
    }

    /**
     * Send a message to a specific user
     * @param phoneNumber Target phone number
     * @param message Message content
     * @param config Send configuration
     */
    public async send(phoneNumber: string, message: string, config?: ISendConfig): Promise<ISendResult> {

        if (!config) {
            throw new Error('config cannot be null or empty');
        }

        // renew token
        await this.renewToken();

        // retrieve current credit
        const currentCredit = await this.currentBalance();

        if (currentCredit < 1) {
            throw new Error(`Current credit is less than 1. So it's not acceptable. Current credit: ${currentCredit}`);
        }

        // perform the request
        const sendResponse = await this.httpClient.post('/MessageSend',
            {
                Messages: [message],
                MobileNumbers: [phoneNumber],

                LineNumber: config?.lineNumber,
                SendDateTime: config?.sendDateTime,
                CanContinueInCaseOfError: config?.canContinueInCaseOfError
            },
            {
                headers: {
                    [AUTH_TOKEN_HEADER_KEY]: this.cache.authToken
                },
                validateStatus: (status: number) => status === 201
            }
        );

        if (!sendResponse.data.IsSuccessful) {
            throw new Error(`Invalid response: ${sendResponse.data.Message}`);
        }

        // retrieve current balance again
        await this.currentBalance();

        // assign short name to the first message
        const msg = sendResponse.data.Ids[0];

        return {
            messageId: msg.ID,
            phoneNumber: msg.MobileNo,
            batchKey: sendResponse.data.BatchKey
        }
    }
}

export default SMSSender;