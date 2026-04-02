const ErrorSchemas = {
    ErrorDetail: {
        type: 'object',
        properties: {
            field: { type: 'string' },
            issue: { type: 'string' }
        },
        example: { field: 'email', issue: 'invalid format' }
    },

    ErrorResponse: {
        type: 'object',
        properties: {
            code: { type: 'integer', format: 'int32' },
            message: { type: 'string' },
            details: {
                type: 'array',
                items: { $ref: '#/components/schemas/ErrorDetail' },
                nullable: true
            }
        },
        example: {
            code: 400,
            message: 'Validation failed',
            details: [ { field: 'email', issue: 'invalid format' } ]
        }
    }
};

module.exports = ErrorSchemas;
