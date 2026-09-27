export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extrai a mensagem de erro do corpo de uma resposta do Nest.
 * A ValidationPipe devolve `message` como array quando vários campos falham.
 */
export function extractErrorMessage(body: string): string {
  if (!body) return "Erro inesperado.";
  try {
    const json = JSON.parse(body) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(json.message)) return json.message.join(", ");
    return json.message ?? json.error ?? body;
  } catch {
    return body;
  }
}
