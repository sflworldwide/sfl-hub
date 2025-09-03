import * as dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from 'sequelize';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Connector } from '@google-cloud/cloud-sql-connector';

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const DB_CONFIG_SECRET_ID = process.env.GCP_SECRET_KEY; 
const DB_DIALECT = process.env.DB_DIALECT;
const CLOUD_SQL_IP_TYPE = process.env.CLOUD_SQL_IP_TYPE; 

const secretManagerClient = new SecretManagerServiceClient();
const sqlConnector = new Connector();

let sequelizeInstance = null; 
let initializationPromise = null; 

async function getDatabaseConfigSecret() {
    if (!GCP_PROJECT_ID) {
        throw new Error('GCP_PROJECT_ID is not configured.');
    }
    const name = `projects/${GCP_PROJECT_ID}/secrets/${DB_CONFIG_SECRET_ID}/versions/latest`;
    try {
        const [version] = await secretManagerClient.accessSecretVersion({ name });
        if (!version.payload || !version.payload.data) {
            throw new Error(`Secret ${DB_CONFIG_SECRET_ID} payload is empty or invalid.`);
        }
        return version.payload.data.toString('utf8');
    } catch (error) {
        console.error(`Failed to access secret ${DB_CONFIG_SECRET_ID} (path: ${name}): ${error.message}`);
        if (error.message.includes('permissions') || error.message.includes('credential')) {
             console.error("Hint: Verify Application Default Credentials (ADC) setup and IAM 'Secret Manager Secret Accessor' role.");
        }
        throw error;
    }
}

// Function to parse the key-value string from the secret
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
            if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            config[key] = value;
        } else {
             if (trimmedLine) {
                 console.warn(`Warning: Skipping malformed line in secret (no '=' found or key empty): "${trimmedLine.substring(0, 50)}${trimmedLine.length > 50 ? '...' : ''}"`);
             }
        }
    }
    return config;
};


// Internal function to perform the actual initialization logic
const performInitialization = async () => {
    try {
        const dbConfigString = await getDatabaseConfigSecret();
        const dbConfig = parseKeyValueString(dbConfigString);

        const dbUser = dbConfig.DB_USER;
        const dbPassword = dbConfig.DB_PASSWORD;
        const dbName = dbConfig.DB_NAME;
        const instanceConnectionName = dbConfig.INSTANCE_CONNECTION_NAME; 
        // const dbHost = dbConfig.DB_HOST; 

        // if (!dbUser || !dbPassword || !dbName || !instanceConnectionName || dbHost ) {
        if (!dbUser || !dbPassword || !dbName || !instanceConnectionName) {
            const missingKeys = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'INSTANCE_CONNECTION_NAME'].filter(k => !dbConfig[k]);
            console.error(`Parsed DB Config validation failed. Missing required keys: ${missingKeys.join(', ')}`);
            throw new Error('Required database configuration is missing or invalid in the fetched secret.');
        }

        const clientOpts = await sqlConnector.getOptions({ 
            instanceConnectionName: instanceConnectionName, 
            ipType: CLOUD_SQL_IP_TYPE,
        });

        const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
            dialect: DB_DIALECT,
            // host: dbHost,
            dialectOptions: { ...clientOpts },
            // pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
            logging: false, 
        });

        await sequelize.authenticate({ requestTimeout: 30000 });
        console.log('Database connection established successfully.');

        const cleanupConnector = () => {
            console.log('Closing Cloud SQL Connector on exit...');
            sqlConnector.close();
            process.removeListener('exit', cleanupConnector);
        };
        process.on('exit', cleanupConnector);

        return sequelize;

    } catch (error) {
        console.error('Error during Sequelize initialization:', error.message);
         if (error.original) { console.error('Original Error:', error.original); }
         if (error.message.includes('password authentication failed')) { console.error("Hint: Double-check password VALUE in Secret Manager. Reset password in PostgreSQL. Verify user exists."); }
         else if (error.message.includes('Cloud SQL Connector') || error.message.includes('Cloud SQL Admin API')) { console.error("Hint: Check IAM 'Cloud SQL Client' role, instance connection name correctness, instance status, network connectivity (firewalls), and ADC setup."); }
         else if (error.message.includes('secret')) { console.error("Hint: Verify Secret ID, Project ID, IAM 'Secret Manager Secret Accessor' role, and ADC setup."); }
        throw error; 
    }
};
async function initializeWithRetry(maxRetries = 5, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await performInitialization();
    } catch (error) {
      console.error(`Initialization attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) throw error;
      await new Promise(res => setTimeout(res, delayMs * attempt)); 
    }
  }
}
const createSequelizeInstance = () => {
    if (!initializationPromise) {
        initializationPromise = initializeWithRetry().catch(err => {
            console.error("Initialization failed permanently after attempt. See previous errors.");
            initializationPromise = null; 
            throw err;
        });
    } else {
    }
    return initializationPromise;
};

export default createSequelizeInstance;