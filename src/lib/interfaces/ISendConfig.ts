/**
 * Send configuration
 */

type ISendConfig = {
    /**
     * The number that you want to send SMS from
     */
    lineNumber: string,

    /**
     * Send immediately or as scheduled
     */
    sendDateTime?: string,

    /**
     * Can continue if any error occurred
     */
    canContinueInCaseOfError: boolean
};

export default ISendConfig;