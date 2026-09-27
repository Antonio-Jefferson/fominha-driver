/**
 * Fábrica central de query keys. Hooks importam daqui; nunca escrevem
 * arrays literais. Chave sempre é array; o primeiro elemento é o recurso.
 */
export const qk = {
  legalDocuments: (audience: string) => ["legal", "documents", audience] as const,
  legalDocument: (slug: string) => ["legal", "document", slug] as const,
  legalPending: () => ["legal", "pending"] as const,
};
