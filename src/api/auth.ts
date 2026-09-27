import { api } from "./client";
import type {
  AllowedCity,
  AuthUser,
  ConfirmationCodeResponse,
  Session,
} from "../@types/auth";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const blankToUndefined = (value?: string) => value?.trim() || undefined;

export function login(input: {
  email: string;
  password: string;
}): Promise<Session> {
  return api.post<Session>("auth/customer/login", {
    email: normalizeEmail(input.email),
    password: input.password,
  });
}

export function requestVerificationCode(input: {
  email: string;
  name?: string;
}): Promise<{ message?: string }> {
  return api.post("auth/email/verification-code", {
    email: normalizeEmail(input.email),
    name: blankToUndefined(input.name),
  });
}

export function confirmVerificationCode(input: {
  email: string;
  code: string;
}): Promise<ConfirmationCodeResponse> {
  return api.post<ConfirmationCodeResponse>("auth/email/confirmation-code", {
    email: normalizeEmail(input.email),
    code: parseInt(input.code, 10),
  });
}

export function signup(input: {
  fullName: string;
  email: string;
  phone?: string;
  city: AllowedCity | string;
  password: string;
  signupToken: string;
  acceptedTerms: string[];
}): Promise<{ message?: string }> {
  return api.post("auth/customer/signup", {
    full_name: input.fullName.trim(),
    email: normalizeEmail(input.email),
    phone: blankToUndefined(input.phone),
    city: input.city,
    password: input.password,
    signup_token: input.signupToken,
    accepted_terms: input.acceptedTerms,
  });
}

export function getMe(): Promise<AuthUser> {
  return api.get<AuthUser>("auth/me");
}

export function updateMe(input: {
  fullName?: string;
  phone?: string | null;
}): Promise<AuthUser> {
  return api.patch<AuthUser>("auth/me", input);
}

export function requestPasswordReset(
  email: string
): Promise<{ message?: string }> {
  return api.post("auth/password/request-reset", {
    email: normalizeEmail(email),
  });
}

export function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ message?: string }> {
  return api.post("auth/password/reset", {
    email: normalizeEmail(input.email),
    code: parseInt(input.code, 10),
    new_password: input.newPassword,
  });
}
