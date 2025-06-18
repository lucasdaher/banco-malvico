const API_BASE_URL = "/api/funcionario";

export interface ResumoCliente {
  id_cliente: number;
  nome_cliente: string;
  cpf: string;
  total_contas: number;
  saldo_total_consolidado: number;
  score_de_credito: number;
}

export interface DashboardStats {
  totalClientes: number;
  volumeTotal: number;
  novasContasMes: number;
  transacoesHoje: number;
}

export interface NovaContaData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  senha: string;
  endereco: {
    cep: string;
    local: string;
    numero_casa: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  tipo_conta: "POUPANCA" | "CORRENTE" | "INVESTIMENTO";
  saldo_inicial: number;

  // Conta Corrente
  limite?: number;
  data_vencimento?: string;
  taxa_manutencao?: number;

  // Conta Poupança
  taxa_rendimento?: number;

  // Conta investidor
  perfil_risco?: "BAIXO" | "MEDIO" | "ALTO";
  valor_minimo?: number;
  taxa_rendimento_base?: number;
}

export interface ClienteDetalhado extends ResumoCliente {
  email: string;
  data_nascimento: string;
  telefone: string;
  endereco: any;
  contas: any[];
}

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
 * Busca a lista resumida de todos os clientes para a tabela de gerenciamento.
 * @returns Uma Promise com a lista de clientes.
 */
export const getClientes = async (): Promise<ResumoCliente[]> => {
  const response = await fetch(`${API_BASE_URL}/clientes`);
  await handleApiError(response);
  return response.json();
};

/**
 * Busca as estatísticas principais para o dashboard do funcionário.
 * @returns Uma Promise com os dados das estatísticas.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/stats`);
  await handleApiError(response);
  return response.json();
};

/**
 * Envia os dados para a API para criar um novo cliente e sua conta.
 * @param dadosConta - Objeto com todos os dados do formulário.
 * @returns Uma Promise com a resposta da API.
 */
export const abrirConta = async (dadosConta: NovaContaData) => {
  const response = await fetch("/api/funcionario/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosConta),
  });
  await handleApiError(response); // Reutilizando nossa função de erro
  return response.json();
};

/**
 * Busca os detalhes completos de um cliente específico pelo ID.
 * @param id - O ID do cliente a ser buscado.
 * @returns Uma Promise com os detalhes do cliente.
 */
export const getClienteById = async (id: string): Promise<ClienteDetalhado> => {
  const response = await fetch(`/api/funcionario/clientes/${id}`);
  await handleApiError(response);
  return response.json();
};
