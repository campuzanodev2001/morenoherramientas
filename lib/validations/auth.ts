import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Ingresá tu nombre'),
    email: z.email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
