import { z } from "zod";
import { BR_STATES } from "../@types/auth";
import { isValidCpf } from "./masks";

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
    // Qualquer cidade do país; o backend só confere que é um nome (2 a 80).
    city: z
      .string()
      .trim()
      .min(2, "Informe sua cidade")
      .max(80, "Nome da cidade muito longo")
      .regex(/\p{L}/u, "Informe sua cidade"),
    state: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
      z.enum([...BR_STATES] as [string, ...string[]], {
        errorMap: () => ({ message: "Informe a UF (ex.: MA, SP)" }),
      })
    ),
    password: z.string().min(6, "A senha precisa de ao menos 6 caracteres"),
    confirmPassword: z.string(),
    acceptedTerms: z
      .array(z.string())
      .min(1, "Você precisa aceitar os documentos obrigatórios"),
    isAdult: z.literal(true, {
      errorMap: () => ({ message: "Confirme que você tem 18 anos ou mais" }),
    }),
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
    .refine(isValidCpf, "Informe um CPF válido"),
  phone: z
    .string()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD"),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  // Cidade e UF de atuação, escolhidas nas listas do IBGE.
  state: z.enum([...BR_STATES] as [string, ...string[]], {
    errorMap: () => ({ message: "Escolha o estado" }),
  }),
  city: z
    .string()
    .trim()
    .min(2, "Informe sua cidade")
    .max(80, "Nome da cidade muito longo")
    .regex(/\p{L}/u, "Informe sua cidade"),
});

export type DriverSignupForm = z.infer<typeof driverSignupSchema>;
