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

/**
 * "Este código já foi utilizado" só pode ocorrer depois que o código de
 * confirmação de entrega já foi de fato consumido — ou seja, é sinal
 * inequívoco de que a entrega já foi confirmada antes (ex: uma tentativa
 * anterior teve sucesso no banco, mas a resposta HTTP falhou em chegar ao
 * app). Usado para distinguir esse caso de um erro real (código incorreto,
 * falha de rede etc.), que deve continuar sendo tratado como erro.
 */
export function isCodeAlreadyUsedError(message: string): boolean {
  return message.toLowerCase().includes("já foi utilizado");
}
