const TodoSchemas = require('./schemas/todo-schema.js');
const UserSchemas = require('./schemas/user-schema.js');
const ErrorSchemas = require('./schemas/error-schema.js');
const AchievementSchemas = require('./schemas/achievement-schema.js');

const components = {
    schemas: {
        ...TodoSchemas,
        ...UserSchemas,
        ...AchievementSchemas,
        ...ErrorSchemas,
    },
    securitySchemes: {
        ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API key required for all /api/v1 endpoints.',
        },
        BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        },
    },
}

module.exports = {
    components,
};
