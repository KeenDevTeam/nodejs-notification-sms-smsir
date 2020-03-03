/**
 * Sender configuration
 */

type ISenderConfig = {

    /**
     * API key
     */
    apiKey: string;

    /**
     * API secret
     */
    secret: string;

    /**
     * ms-compatible value (e.g. '30m')
     */
    authTimeout: string;
};

export default ISenderConfig;