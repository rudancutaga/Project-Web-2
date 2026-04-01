const { z } = require('zod');

const friendActionSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const sendMessageSchema = z.object({
  to: z.coerce.number().int().positive(),
  body: z.string().min(1).max(2000),
});

module.exports = {
  friendActionSchema,
  sendMessageSchema,
};
