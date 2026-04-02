const swaggerJSDoc = require('swagger-jsdoc');
const { components } = require('./components/index.js');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Board Game API',
            version: '1.0.0',
            description: 'SPA board games backend',
        },
        servers: [
            {
                url:
                    process.env.BASE_URL ||
                    `https://localhost:${process.env.PORT || 3443}/api/v1`,
            },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Users', description: 'User endpoints' },
            { name: 'Games', description: 'Game catalog & ratings' },
            { name: 'Sessions', description: 'Play sessions & moves' },
            { name: 'Social', description: 'Friends & messages' },
            { name: 'Admin', description: 'Admin toggles & stats' },
        ],
        security: [
            { ApiKeyAuth: [] },
        ],
        components: { ...components, }
    },

    apis: [
        "./root/routes/*.js",
        "./root/routes/**/*.js",
    ],
}

function buildSwaggerSpec() {
    return swaggerJSDoc(options);
}

module.exports = {
    buildSwaggerSpec,
};
