import axios from 'axios';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClient = new SecretManagerServiceClient();

const parseKeyValueString = (secretString) => {
    const config = {};
    if (!secretString) {
        console.warn('Warning: Received empty secret string for parsing.');
        return config;
    }
    const lines = secretString.split(/\r?\n/);
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue; 
        const delimiterIndex = trimmedLine.indexOf('=');
        if (delimiterIndex > 0) {
            const key = trimmedLine.substring(0, delimiterIndex).trim();
            let value = trimmedLine.substring(delimiterIndex + 1).trim();
            if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
                value = value.substring(1, value.length - 1);
            }
            config[key] = value;
        } else if (trimmedLine) {
            console.warn(`Warning (parseKeyValueString): Skipping malformed line: "${trimmedLine.substring(0, 50)}${trimmedLine.length > 50 ? '...' : ''}"`);
        }
    }
    return config;
};

async function fetchPaymentSecrets() {
    const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
    const PAYMENT_SECRET_ID = process.env.GCP_SECRET_KEY; 
    if (!GCP_PROJECT_ID) {
        throw new Error('FATAL: GCP_PROJECT_ID environment variable is not set.');
    }
    if (!PAYMENT_SECRET_ID) {
        throw new Error('FATAL: GCP_SECRET_KEY (or your chosen env var for payment secrets) environment variable is not set.');
    }
    const secretName = `projects/${GCP_PROJECT_ID}/secrets/${PAYMENT_SECRET_ID}/versions/latest`;
    try {
        const [version] = await secretClient.accessSecretVersion({ name: secretName });
        const payload = version.payload.data.toString('utf8');;
        const allSecrets = parseKeyValueString(payload);
        const apiLoginId = allSecrets.AUTHORIZE_NET_API_LOGIN_ID;
        const transactionKey = allSecrets.AUTHORIZE_NET_TRANSACTION_KEY;
        if (!apiLoginId) {
            console.error('Error: AUTHORIZE_NET_API_LOGIN_ID not found in the parsed secret content from Secret Manager.', allSecrets);
            throw new Error('AUTHORIZE_NET_API_LOGIN_ID key missing in secret payload.');
        }
        if (!transactionKey) {
            console.error('Error: AUTHORIZE_NET_TRANSACTION_KEY not found in the parsed secret content from Secret Manager.', allSecrets);
            throw new Error('AUTHORIZE_NET_TRANSACTION_KEY key missing in secret payload.');
        }
        return {
            apiLoginId: apiLoginId.trim(),
            transactionKey: transactionKey.trim()
        };

    } catch (error) {
        console.error(`Error accessing or parsing secret ${secretName}:`, error);
        throw new Error(`Failed to fetch or parse payment secrets from ${secretName}. ${error.message}`);
    }
}

let paymentCredentials = null;

async function initializePaymentCredentials() {
    if (paymentCredentials) {
        return paymentCredentials;
    }

    try {
        const paymentKeys = await fetchPaymentSecrets(); 
        const tokenUrl = process.env.AUTHORIZE_NET_TOKEN_URL;
        const baseUrl = process.env.PAY_SFL_URL;
        if (!tokenUrl) {
            console.error('FATAL: AUTHORIZE_NET_TOKEN_URL environment variable is not set or not loaded. Check .env file and dotenv setup.');
            throw new Error('AUTHORIZE_NET_TOKEN_URL environment variable is missing.');
        }
        if (!baseUrl) {
            console.error('FATAL: PAY_SFL_URL environment variable is not set or not loaded. Check .env file and dotenv setup.');
            throw new Error('PAY_SFL_URL environment variable is missing.');
        }

        paymentCredentials = {
            apiLoginId: paymentKeys.apiLoginId,         
            transactionKey: paymentKeys.transactionKey, 
            tokenUrl: tokenUrl.trim(),                  
            baseUrl: baseUrl.trim()                     
        };

        // console.log('Payment credentials initialized successfully.');
        return paymentCredentials;

    } catch (error) {
        console.error('Failed to initialize payment credentials:', error.message);
        paymentCredentials = null;
        throw new Error(`Payment service configuration failed: ${error.message}`);
    }
}

async function generateHostedPaymentToken(amount, billingInfo, trackingNumber) {
    if (!amount) {
        throw new Error('Missing required payment information: amount is required');
    }
    if (!billingInfo) {
        throw new Error('Missing required payment information: billing details are required');
    }

    try {
        const credentials = await initializePaymentCredentials();
        if (!credentials || !credentials.apiLoginId || !credentials.transactionKey || !credentials.tokenUrl || !credentials.baseUrl) {
            console.error("Critical Error: Payment credentials object is missing or incomplete before API call.", credentials);
            throw new Error("Internal Server Error: Payment credentials not properly initialized.");
        }

        const requestData = {
            getHostedPaymentPageRequest: {
                merchantAuthentication: {
                    name: credentials.apiLoginId,     
                    transactionKey: credentials.transactionKey 
                },
                transactionRequest: {
                    transactionType: 'authCaptureTransaction',
                    amount: amount,
                    order: {
                        invoiceNumber: trackingNumber,
                        description: "Payment for shipment"
                    },
                    billTo: billingInfo
                },
                hostedPaymentSettings: {
                    setting: [
                        {
                            settingName: 'hostedPaymentReturnOptions',
                            settingValue: `{"showReceipt":false,"url":"${credentials.baseUrl}/payment-success","urlText":"Continue","cancelUrl":"${credentials.baseUrl}/payment-cancel","cancelUrlText":"Cancel"}` 
                        },
                        { settingName: 'hostedPaymentButtonOptions', settingValue: `{"text":"Pay"}` },
                        { settingName: 'hostedPaymentOrderOptions',  settingValue: `{"show":true,"merchantName":"SFL WORLDWIDE"}`},
                        { 
                            settingName: 'hostedPaymentPaymentOptions',
                            settingValue: `{"cardCodeRequired":true,"showCreditCard":true,"showBankAccount":true}` 
                          },
                        { settingName: 'hostedPaymentSecurityOptions', settingValue: `{"captcha":false}` },
                        { settingName: 'hostedPaymentStyleOptions', settingValue: `{"bgColor":"#d01d10"}` }
                    ]
                }
            }
        };

        const response = await axios.post(credentials.tokenUrl, requestData, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.data && response.data.messages && response.data.messages.resultCode === 'Error') {
            console.error('Authorize.Net API Error Response:', JSON.stringify(response.data.messages, null, 2));
            const errorMessages = response.data.messages.message.map(m => `Code: ${m.code}, Text: ${m.text}`).join('; ');
            throw new Error(`Authorize.Net API returned an error: ${errorMessages}`);
        } else if (response.data?.getHostedPaymentPageResponse?.messages?.resultCode === 'Error') {
             console.error('Authorize.Net API Error Response (nested):', JSON.stringify(response.data.getHostedPaymentPageResponse.messages, null, 2));
             const errorMessages = response.data.getHostedPaymentPageResponse.messages.message.map(m => `Code: ${m.code}, Text: ${m.text}`).join('; ');
             throw new Error(`Authorize.Net API returned an error: ${errorMessages}`);
        } else if (response.data?.getHostedPaymentPageResponse?.token) {
            const token = response.data.getHostedPaymentPageResponse.token;
            console.log('Successfully generated Authorize.Net hosted payment token.');
            return { token };
        } else if (response.data?.token) {
             console.log('Successfully generated Authorize.Net hosted payment token');
            return { token: response.data.token };
        } else {
            console.error('Token not found in Authorize.Net response. Unexpected structure:', JSON.stringify(response.data, null, 2));
            throw new Error('Token not found in the Authorize.Net response (unexpected format).');
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {
             console.error('Axios Error during Authorize.Net request:', error.message);
            if (error.response) {
                console.error('Authorize.Net Error Response Status:', error.response.status);
                console.error('Authorize.Net Error Response Data:', JSON.stringify(error.response.data, null, 2));
                 const messages = error.response.data?.messages?.message || error.response.data?.getHostedPaymentPageResponse?.messages?.message;
                 const specificError = messages ? messages.map(m => `Code: ${m.code}, Text: ${m.text}`).join('; ') : JSON.stringify(error.response.data);
                 throw new Error(`Payment API request failed: ${specificError}`);
            } else if (error.request) {
                console.error('Authorize.Net request was made but no response received:', error.request);
                throw new Error('Payment API request failed: No response from Authorize.Net.');
            } else {
                console.error('Error setting up Authorize.Net request:', error.message);
                 throw new Error(`Payment API request failed: ${error.message}`);
            }
        } else {
             console.error('Error in payment API request processing:', error.message);
             throw new Error(`Payment API request failed: ${error.message}`);
        }
    }
}


function processPaymentCallback(transactionData) {

    if (!transactionData || Object.keys(transactionData).length === 0) {
        console.warn('processPaymentCallback received empty transactionData.');
        return { success: false, message: 'No transaction data received.' };
    }

    const transactionId = transactionData.transId || transactionData.x_trans_id;
    const authCode = transactionData.authCode || transactionData.x_auth_code;
    const amount = transactionData.amount || transactionData.x_amount;
    const responseCode = transactionData.responseCode?.toString() || transactionData.x_response_code?.toString();
    const avsResponseCode = transactionData.avsResultCode || transactionData.x_avs_code;
    const isSuccess = responseCode === '1';

    console.log('Processed transaction details:', {
        transactionId,
        authCode,
        amount,
        responseCode,
        avsResponseCode,
        isSuccess
    });

    return {
        transactionId,
        authCode,
        amount,
        responseCode,
        avsResponseCode,
        success: isSuccess
    };
}

export { generateHostedPaymentToken, processPaymentCallback };