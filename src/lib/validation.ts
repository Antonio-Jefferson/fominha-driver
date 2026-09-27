import { z } from "zod";
import { ALLOWED_CITIES } from "../@types/auth";

// zod 3.25's built-in .email() exige TLD de 2+ letras e rejeita "a@b.c".
// Uma checagem simples de "algo@algo.algo" basta para o front; o backend valida de verdade.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailField = z.string().regex(EMAIL_RE, "E-mail inválido");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Informe a senha"),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().min(3, "Informe seu nome completo"),
    email: emailField,
    phone: z.string().optional(),
    // O backend rejeita qualquer cidade fora desta lista com 400.
    city: z.enum([...ALLOWED_CITIES] as [string, ...string[]], {
      errorMap: () => ({ message: "Escolha uma cidade atendida" }),
    }),
    password: z.string().min(6, "A senha precisa de ao menos 6 caracteres"),
    confirmPassword: z.string(),
    acceptedTerms: z
      .array(z.string())
      .min(1, "Você precisa aceitar os documentos obrigatórios"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type SignupForm = z.infer<typeof signupSchema>;

export const emailSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "A senha precisa de ao menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export const driverSignupSchema = z.object({
  fullName: z.string().min(3, "Informe seu nome completo"),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, "Informe um CPF válido"),
  phone: z.string().min(8, "Informe um telefone válido"),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  city: z.enum([...ALLOWED_CITIES] as [string, ...string[]], {
    errorMap: () => ({ message: "Escolha sua cidade de atuação" }),
  }),
});

export type DriverSignupForm = z.infer<typeof driverSignupSchema>;
