const UserSchemas = {
    User: {
        type: 'object',
        required: ['id', 'name', 'email'],
        properties: {
            id: { type: 'integer', format: 'int32' },
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'client'] },
            display_name: { type: 'string', nullable: true },
            avatar_url: { type: 'string', format: 'uri', nullable: true },
            bio: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time', nullable: true },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
        },
        example: {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'client',
            display_name: 'John',
            avatar_url: null,
            bio: 'Nguoi choi yeu thich caro.',
            is_active: true,
            created_at: '2026-01-01T12:00:00Z',
            updated_at: '2026-01-02T12:00:00Z'
        }
    },

    CreateUser: {
        type: 'object',
        required: ['name', 'email', 'password', 'passwordConfirm'],
        properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            passwordConfirm: { type: 'string', minLength: 6 },
        },
        example: {
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            password: 'strongpassword',
            passwordConfirm: 'strongpassword',
        }
    },

    LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
        },
        example: {
            email: 'jane.doe@example.com',
            password: 'strongpassword'
        }
    }
};

module.exports = UserSchemas;
