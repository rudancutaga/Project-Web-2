const TodoSchema = {
    Todo: {
        type:   'object',
        required: ['id', 'user_id', 'title', 'status', 'created_at', 'updated_at'],
        properties: {
            id: {type: 'integer', format: 'int32'},
            user_id: {type: 'integer', format: 'int32'},
            title: {type: 'string', minLength: 1},
            description: {type: 'string', nullable: true},
            status: {type: 'string', enum: ["PENDING", "DONE"]},
            due_date: {type: 'string', format: 'date-time', nullable: true},
            created_at: {type: 'string', format: 'date-time'},
            updated_at: {type: 'string', format: 'date-time'}
        },
        example: {
            id: 1,
            user_id: 10,
            title: "Learn Express v5",
            description: "Read the documentation and build a sample app",
            status: "PENDING",
            due_date: "2024-12-31T23:59:59Z",
            created_at: "2024-01-01T12:00:00Z",
            updated_at: "2024-01-02T12:00:00Z"
        },
    },
};

module.exports = TodoSchema;