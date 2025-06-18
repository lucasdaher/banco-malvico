import { DadosConta, Transacao } from "@/types/models";

const API_BASE_URL = "/api/cliente";

/**
 * Função genérica para lidar com erros da API.
 * Se a resposta não for 'ok', extrai a mensagem de erro e a lança.
 * @param response - A resposta do fetch.
 */
async function handleApiError(response: Response) {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Ocorreu um erro desconhecido.");
  }
}

/**
 * Busca os dados principais da conta do cliente logado.
 * @returns Uma Promise com os dados da conta.
 */
export const getDadosConta = async (): Promise<DadosConta> => {
  const response = await fetch(`${API_BASE_URL}/dados-conta`);
  await handleApiError(response);
  return response.json();
};

/**
 * Busca o extrato de transações do cliente, com filtros opcionais.
 * @param params - Objeto com data_inicio e data_fim.
 * @returns Uma Promise com a lista de transações.
 */
export const getExtrato = async (params?: {
  data_inicio?: string;
  data_fim?: string;
}): Promise<Transacao[]> => {
  const queryParams = new URLSearchParams();

  if (params?.data_inicio) {
    queryParams.append("data_inicio", params.data_inicio);
  }
  if (params?.data_fim) {
    queryParams.append("data_fim", params.data_fim);
  }

  const response = await fetch(
    `/api/cliente/operacoes/extrato?${queryParams.toString()}`
  );

  await handleApiError(response);
  return response.json();
};

/**
 * Realiza um depósito na conta do cliente logado.
 * @param valor - O valor a ser depositado.
 * @returns Uma Promise com a resposta da API.
 */
export const realizarDeposito = async (valor: number) => {
  const response = await fetch(`${API_BASE_URL}/operacoes/deposito`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor }),
  });
  await handleApiError(response);
  return response.json();
};

/**
 * Realiza um saque da conta do cliente logado.
 * @param valor - O valor a ser sacado.
 * @returns Uma Promise com a resposta da API.
 */
export const realizarSaque = async (valor: number) => {
  const response = await fetch(`${API_BASE_URL}/operacoes/saque`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor }),
  });
  await handleApiError(response);
  return response.json();
};

/**
 * Realiza uma transferência da conta do cliente logado para outra conta.
 * @param data - Objeto com numero_conta_destino e valor.
 * @returns Uma Promise com a resposta da API.
 */
export const realizarTransferencia = async (data: {
  numero_conta_destino: string;
  valor: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/operacoes/transferencia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleApiError(response);
  return response.json();
};

export interface LimiteDiario {
  limiteTotalDiario: number;
  totalDepositadoHoje: number;
  limiteRestante: number;
}

/**
 * Busca o status do limite de depósito diário do cliente.
 * @returns Uma Promise com os dados do limite diário.
 */
export const getLimiteDiario = async (): Promise<LimiteDiario> => {
  const response = await fetch("/api/cliente/limite-diario");
  await handleApiError(response);
  return response.json();
};
