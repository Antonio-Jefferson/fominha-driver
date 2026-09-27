import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "./client";

export type LegalAudience = "CUSTOMER" | "ESTABLISHMENT" | "DRIVER" | "ALL";

export interface LegalDocumentSummary {
  slug: string;
  title: string;
  version: string;
  versionId: string;
  audience: LegalAudience;
  required: boolean;
  effectiveAt: string;
}

export interface LegalDocument extends LegalDocumentSummary {
  bodyMarkdown: string;
}

export interface PendingAcceptance {
  slug: string;
  title: string;
  version: string;
  versionId: string;
  reason: "NEVER_ACCEPTED" | "NEW_VERSION";
}

function currentPlatform(): "MOBILE_ANDROID" | "MOBILE_IOS" {
  return Platform.OS === "ios" ? "MOBILE_IOS" : "MOBILE_ANDROID";
}

/**
 * Documentos obrigatórios vigentes para o público informado. Filtra no
 * cliente porque o backend devolve todos os documentos vigentes de uma vez
 * (todos os públicos) em `GET /legal/documents`.
 */
export async function listLegalDocuments(
  audience: "CUSTOMER" | "ESTABLISHMENT" = "CUSTOMER"
): Promise<LegalDocumentSummary[]> {
  const all = await api.get<LegalDocumentSummary[]>("legal/documents");
  return all.filter(
    (d) => d.required && (d.audience === "ALL" || d.audience === audience)
  );
}

export async function getLegalDocument(slug: string): Promise<LegalDocument> {
  return api.get<LegalDocument>(`legal/documents/${slug}`);
}

export async function getPendingAcceptances(): Promise<PendingAcceptance[]> {
  return api.get<PendingAcceptance[]>("legal/pending");
}

export async function acceptTerms(
  slugs: string[]
): Promise<{ accepted: number }> {
  return api.post<{ accepted: number }>("legal/acceptances", {
    slugs,
    platform: currentPlatform(),
    app_version: Constants.expoConfig?.version ?? "0.0.0",
  });
}
