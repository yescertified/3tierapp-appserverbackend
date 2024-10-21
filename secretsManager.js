const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'us-east-1' // e.g., 'us-east-1'
});

const secretsManager = new AWS.SecretsManager();

async function getDatabaseCredentials() {
    const params = {
        SecretId: 'prod/threetier' // Replace with your Secrets Manager secret ID
    };

    const secretValue = await secretsManager.getSecretValue(params).promise();
    return JSON.parse(secretValue.SecretString);
}

module.exports = getDatabaseCredentials;
