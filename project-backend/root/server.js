require('dotenv').config();

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const app = require('./app.js');
const db = require('../db/db.js');
const { syncCatalogGames } = require('./services/game-contract-s.js');

const HTTPS_PORT = Number(process.env.PORT) || 3443;
const HTTP_PORT = Number(process.env.HTTP_PORT) || 3080;
const DEFAULT_CERT_PATH = path.resolve(__dirname, '../certs/localhost-cert.pem');
const DEFAULT_KEY_PATH = path.resolve(__dirname, '../certs/localhost-key.pem');

function resolveTlsFile(explicitPath, fallbackPath) {
    return path.resolve(explicitPath || fallbackPath);
}

function loadTlsOptions() {
    const certEnvPath = process.env.HTTPS_CERT_PATH || process.env.SSL_CERT_PATH;
    const keyEnvPath = process.env.HTTPS_KEY_PATH || process.env.SSL_KEY_PATH;
    const certPath = resolveTlsFile(certEnvPath, DEFAULT_CERT_PATH);
    const keyPath = resolveTlsFile(keyEnvPath, DEFAULT_KEY_PATH);

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        throw new Error(
            `HTTPS certificate files are missing. Expected cert at "${certPath}" and key at "${keyPath}".`
        );
    }

    return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
    };
}

function createHttpRedirectServer() {
    return http.createServer((req, res) => {
        const hostHeader = req.headers.host || `localhost:${HTTP_PORT}`;
        const host = hostHeader.replace(/:\d+$/, '');
        const location = `https://${host}:${HTTPS_PORT}${req.url || '/'}`;

        res.writeHead(301, { Location: location });
        res.end();
    });
}

async function startServer() {
    try {
        await db.raw('SELECT 1+1 AS result');
        console.log('Database connected successfully.');
        await syncCatalogGames();
        console.log('Game catalog synchronized successfully.');

        const httpsServer = https.createServer(loadTlsOptions(), app);
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS Server is running on port ${HTTPS_PORT}`);
        });

        if (HTTP_PORT !== HTTPS_PORT) {
            const httpRedirectServer = createHttpRedirectServer();
            httpRedirectServer.listen(HTTP_PORT, () => {
                console.log(
                    `HTTP redirect server is running on port ${HTTP_PORT} and forwarding to HTTPS ${HTTPS_PORT}`
                );
            });
        }
    } catch (error) {
        console.error('Failed to start the server:', error);
    }
}

startServer();
