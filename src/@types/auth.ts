export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  defaultAddress?: {
    id: string;
    city?: string;
    state?: string;
    isDefault: boolean;
  } | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  expires_at: string;
  user?: AuthUser;
}

export interface ConfirmationCodeResponse {
  signupToken: string;
}

export const ALLOWED_CITIES = [
  "Gov. Newton Bello",
  "Zé Doca",
  "Bom Jardim",
  "Santa Inês",
] as const;

export type AllowedCity = (typeof ALLOWED_CITIES)[number];
