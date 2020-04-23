/**
 * SMS sender mock
 */

import { AxiosInstance } from 'axios';

import SMSSender from '../../src';

import ISenderConfig from '../../src/lib/interfaces/ISenderConfig';

class SMSSenderMock extends SMSSender {

    public get axiosInstance(): AxiosInstance {
        return this.httpClient;
    }

    public get config_test(): ISenderConfig {
        return this.config;
    }

    public get cache_test() {
        return this.cache;
    }

    public async renewToken_test(): Promise<void> {
        return await this.renewToken();
    }

    public async currentBalance_test(): Promise<number> {
        return await this.currentBalance();
    }
}

export default SMSSenderMock;