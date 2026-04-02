const { z } = require('zod');

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name phải có ít nhất 2 ký tự')
      .max(100, 'Name tối đa 100 ký tự'),

    email: z
      .string()
      .email('Email không hợp lệ')
      .max(255, 'Email tối đa 255 ký tự'),

    password: z
      .string()
      .min(8, 'Password phải có ít nhất 8 ký tự')
      .max(128, 'Password tối đa 128 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'
      ),

    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Password và Password Confirm không khớp',
    path: ['passwordConfirm'],
  });

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Password không được để trống'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
};
