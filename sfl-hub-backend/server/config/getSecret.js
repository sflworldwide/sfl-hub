import{ SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(secretId) {
  const projectId = process.env.GCP_PROJECT_ID;

  if (!projectId) {
    console.error('Error: GCP_PROJECT_ID environment variable is not set.');
    throw new Error('GCP_PROJECT_ID environment variable is not set.');
  }

  const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;
  console.log(`Attempting to access secret: ${name}`); 

  try {
    const [version] = await client.accessSecretVersion({ name });
    if (!version.payload || !version.payload.data) {
        throw new Error(`Secret ${secretId} payload is empty or invalid.`);
    }
    return version.payload.data.toString('utf8');
  } catch (error) {
    console.error(`❌ Failed to access secret ${secretId} (path: ${name}): ${error.message}`);
    throw error;
  }
}

export default  getSecret ;