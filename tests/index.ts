/**
 * Tests entry point
 */

import 'mocha';
import chai, { expect } from 'chai';
import sleep from 'sleep';
import MockAdapter from 'axios-mock-adapter';
import ChaiAsPromised from 'chai-as-promised';

import Mdl from '../src/index';

import SMSSender from './mock/SMSSenderMock';

chai.use(ChaiAsPromised);

describe('SpeedUP|Notification|SMS|SMS.ir', () => {

    describe('integrity', () => {

        it('should be a class constructor', () => {
            expect(Mdl).to.be.a('function');
        });
    });

    describe('functionality', () => {

        let mock: MockAdapter;
        let instance: SMSSender;

        beforeEach((done) => {

            instance = new SMSSender({
                apiKey: '123',
                secret: '!@#',
                authTimeout: '5s'
            });

            mock = new MockAdapter(instance.axiosInstance);

            done();
        });

        afterEach((done) => {
            mock.reset();

            return done();
        });

        describe('constructor', () => {

            it('should throw error if config is undefined', () => {

                expect(() => new Mdl()).to.throw('config cannot be null or empty');
            });
        });

        describe('renewToken', () => {

            describe('failed', () => {

                it('should throw error in case of network error', async () => {

                    mock.onPost('/Token').networkError();
                    await expect(instance.renewToken_test()).to.be.rejectedWith('Network Error');
                });

                it('should throw error in case of invalid status', async () => {

                    mock.onPost('/Token').replyOnce(200);
                    await expect(instance.renewToken_test()).to.be.rejectedWith(`Request failed with status code 200`);
                });

                it('should handle server-side error(s)', async () => {

                    mock.onPost('/Token').replyOnce(201, {
                        IsSuccessful: false,
                        Message: 'auth-failed'
                    });

                    await expect(instance.renewToken_test()).to.be.rejectedWith('Invalid response: auth-failed');
                });
            });

            describe('success', () => {

                it('should be called once before timeout reaches', async () => {

                    mock.onPost('/Token').reply(201, {
                        IsSuccessful: true,
                        Message: 'OK',
                        TokenKey: 'my-token-key'
                    });

                    await instance.renewToken_test();
                    const currentTimestamp = instance.cache_test.lastAuthRetry;
                    expect(instance.cache_test.authToken).to.be.a('string').that.is.eq('my-token-key');

                    sleep.sleep(1);

                    await instance.renewToken_test();
                    expect(instance.cache_test.lastAuthRetry).to.be.eq(currentTimestamp);
                }).timeout('2s');

                it('should be called twice after timeout reaches', async () => {

                    mock.onPost('/Token').reply(201, {
                        IsSuccessful: true,
                        Message: 'OK',
                        TokenKey: 'my-token-key'
                    });

                    await instance.renewToken_test();
                    const currentTimestamp = instance.cache_test.lastAuthRetry;
                    expect(instance.cache_test.authToken).to.be.a('string').that.is.eq('my-token-key');

                    sleep.sleep(6);

                    await instance.renewToken_test();
                    expect(instance.cache_test.lastAuthRetry).to.be.gt(currentTimestamp);
                }).timeout('10s');
            });
        });

        describe('currentBalance', () => {

            beforeEach((done) => {

                mock.onPost('/Token').reply(201, {
                    IsSuccessful: true,
                    Message: 'OK',
                    TokenKey: 'my-token-key'
                });

                return done();
            });

            it('should contain add auth header', async () => {

                mock.onGet('/credit', {
                    headers: {
                        'x-sms-ir-secure-token': 'my-token-key'
                    }
                }).reply(201, {
                    IsSuccessful: true,
                    Message: 'OK',
                    Credit: 100
                });

                const credit = await instance.currentBalance_test();
                expect(credit).to.be.eq(100);
            });

            describe('failed', () => {

                it('should throw error in case of network error', async () => {

                    mock.onGet('/credit').networkError();
                    await expect(instance.currentBalance_test()).to.be.rejectedWith('Network Error');
                });

                it('should throw error in case of invalid status', async () => {

                    mock.onGet('/credit').replyOnce(200);
                    await expect(instance.currentBalance_test()).to.be.rejectedWith(`Request failed with status code 200`);
                });

                it('should handle server-side error(s)', async () => {

                    mock.onGet('/credit').replyOnce(201, {
                        IsSuccessful: false,
                        Message: 'auth-failed'
                    });

                    await expect(instance.currentBalance_test()).to.be.rejectedWith('Invalid response: auth-failed');
                });
            });

            describe('success', () => {

                it('should return current balance of the account', async () => {

                    mock.onGet('/credit', {
                        headers: {
                            'x-sms-ir-secure-token': 'my-token-key'
                        }
                    }).reply(201, {
                        IsSuccessful: true,
                        Message: 'OK',
                        Credit: 100
                    });

                    const credit = await instance.currentBalance_test();
                    expect(credit).to.be.eq(100);
                });
            });
        });

        describe('send', () => {

            beforeEach((done) => {

                mock.onPost('/Token').reply(201, {
                    IsSuccessful: true,
                    Message: 'OK',
                    TokenKey: 'my-token-key'
                });

                mock.onGet('/credit').reply(201, {
                    IsSuccessful: true,
                    Message: 'OK',
                    Credit: 1
                });

                return done();
            });

            describe('failed', () => {

                it('should throw exception cause config is undefined', async () => {

                    await expect(instance.send('123456789', 'a text message')).to.be.rejectedWith('config cannot be null or empty');
                });

                it('should fail because of not having enough credit', async () => {

                    mock.onGet('/credit').reply(201, {
                        IsSuccessful: true,
                        Message: 'OK',
                        Credit: 0
                    });

                    await expect(instance.send('123456789', 'a text message', {
                        lineNumber: '123456',
                        sendDateTime: '',
                        canContinueInCaseOfError: true
                    })).to.be.rejectedWith('Current credit is less than 1. So it\'s not acceptable. Current credit: 0');
                });

                it('should fail because of the unacceptable status code', async () => {

                    mock.onPost('/MessageSend').reply(200, {});

                    await expect(instance.send('123456789', 'a text message', {
                        lineNumber: '123456',
                        sendDateTime: '',
                        canContinueInCaseOfError: true
                    })).to.be.rejectedWith('Request failed with status code 200');
                });

                it('should fail because of the server error', async () => {

                    mock.onPost('/MessageSend').reply(201, {
                        IsSuccessful: false,
                        Message: 'server-error'
                    });

                    await expect(instance.send('123456789', 'a text message', {
                        lineNumber: '123456',
                        sendDateTime: '',
                        canContinueInCaseOfError: true
                    })).to.be.rejectedWith('Invalid response: server-error');
                });
            });

            describe('success', () => {

                it('should send the message', async () => {

                    mock.onPost('/MessageSend').reply(201, {
                        Ids: [
                            {
                                ID: 1441579,
                                MobileNo: '9131150815'
                            }
                        ],
                        BatchKey: 'eeb749a5-ec6d-4d6e-a656-56e731fb3eb5',
                        IsSuccessful: true,
                        Message: 'ارسال با موفقیت انجام گردید'
                    });

                    const result = await instance.send('123456789', 'a text message', {
                        lineNumber: '123456',
                        sendDateTime: '',
                        canContinueInCaseOfError: true
                    });

                    expect(result).to.be.an('object');
                    expect(result).to.have.property('messageId').that.is.a('number').which.is.eq(1441579);
                    expect(result).to.have.property('phoneNumber').that.is.a('string').which.is.eq('9131150815');
                    expect(result).to.have.property('batchKey').that.is.a('string').which.is.eq('eeb749a5-ec6d-4d6e-a656-56e731fb3eb5');
                });
            });
        });
    });
});