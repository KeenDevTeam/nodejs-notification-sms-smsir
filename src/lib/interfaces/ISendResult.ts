/**
 * Send result
 */

type ISendResult = {
    /**
     * Message ID in the provider's database
     */
    messageId: string,

    /**
     * Target phone number
     */
    phoneNumber: string,

    /**
     * Batch operation key
     */
    batchKey: string
};

export default ISendResult;