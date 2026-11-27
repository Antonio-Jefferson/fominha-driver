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

/** As 27 UFs. O Fominha atende o Brasil inteiro: a cidade é livre. */
export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrState = (typeof BR_STATES)[number];
