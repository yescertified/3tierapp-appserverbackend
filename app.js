const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const cors = require('cors');
const getDatabaseCredentials = require('./secretsManager');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configure AWS SDK
AWS.config.update({
    region: 'us-east-1' // e.g., 'us-east-1'
});

const s3 = new AWS.S3();

// Multer S3 configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'threetierbucketmk',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '_' + file.originalname);
        }
    })
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Backend is healthy');
});

// Main Endpoint to Collect Data
app.post('/submit', upload.single('image'), async (req, res) => {
    try {
        const { name, email, secret_number } = req.body;
        const image_url = req.file.location;

        // Get DB credentials from Secrets Manager
        const dbCredentials = await getDatabaseCredentials();

        // Create MySQL connection
        const connection = await mysql.createConnection({
            host: 'userdb.coni7vrobjzv.us-east-1.rds.amazonaws.com',
            user: dbCredentials.username,
            password: dbCredentials.password,
            database: 'userdb'
        });

        // Insert data into database
        await connection.execute(
            'INSERT INTO users (name, email, secret_number, image_url) VALUES (?, ?, ?, ?)',
            [name, email, secret_number, image_url]
        );

        await connection.end();

        res.status(200).json({ message: 'Data submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Start the Server
app.listen(3000, () => {
    console.log('Backend server is running on port 3000');
});
