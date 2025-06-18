const API_BASE_URL = "/api/funcionario";

export interface ResumoCliente {
  id_cliente: number;
  nome_cliente: string;
  cpf: string;
  total_contas: number;
  saldo_total_consolidado: number;
  score_de_credito: number;
}

export interface UpdateClienteData {
  nome: string;
  telefone: string;
  email: string;
  endereco: {
    cep: string;
    local: string;
    numero_casa: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

export interface NovoFuncionarioData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  senha: string;
  cargo: "ESTAGIARIO" | "ATENDENTE" | "GERENTE";
}

export interface RelatorioInadimplente {
  nome_cliente: string;
  cpf: string;
  numero_conta: string;
  saldo: number;
  tipo_conta: string;
  status: string;
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

export interface RelatorioMovimentacao {
  id_transacao: number;
  data_hora: string;
  tipo_transacao: string;
  valor: number;
  descricao: string | null;
  nome_cliente: string;
  cpf: string;
  numero_conta: string;
  nome_agencia: string;
  id_agencia: number;
}

export interface RelatorioInadimplente {
  nome_cliente: string;
  cpf: string;
  numero_conta: string;
  saldo: number;
}

export interface RelatorioDesempenho {
  id_funcionario: number;
  nome_funcionario: string;
  cargo: string;
  contas_abertas_total: number;
  contas_abertas_mes: number;
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

/**
 * Busca o relatório de clientes com saldo negativo.
 * @returns Uma Promise com a lista de clientes inadimplentes.
 */
export const getRelatorioInadimplentes = async (): Promise<
  RelatorioInadimplente[]
> => {
  const response = await fetch("/api/funcionario/relatorios/inadimplentes");
  await handleApiError(response);
  return response.json();
};

export const getRelatorioMovimentacoes = async (filters: {
  data_inicio?: string;
  data_fim?: string;
  tipo_transacao?: string;
}): Promise<RelatorioMovimentacao[]> => {
  const cleanFilters: { [key: string]: string } = {};

  if (filters.data_inicio) cleanFilters.data_inicio = filters.data_inicio;
  if (filters.data_fim) cleanFilters.data_fim = filters.data_fim;
  if (filters.tipo_transacao)
    cleanFilters.tipo_transacao = filters.tipo_transacao;

  const queryParams = new URLSearchParams(cleanFilters);
  const response = await fetch(
    `/api/funcionario/relatorios/movimentacoes?${queryParams.toString()}`
  );

  await handleApiError(response);
  return response.json();
};

export const getRelatorioDesempenho = async (): Promise<
  RelatorioDesempenho[]
> => {
  const response = await fetch("/api/funcionario/relatorios/desempenho");
  await handleApiError(response);
  return response.json();
};

/**
 * Envia os dados para a API para cadastrar um novo funcionário.
 * Apenas gerentes podem executar esta ação.
 * @param dadosFuncionario - Objeto com os dados do formulário.
 * @returns Uma Promise com a resposta da API.
 */
export const cadastrarFuncionario = async (
  dadosFuncionario: NovoFuncionarioData
) => {
  const response = await fetch("/api/funcionario/funcionarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosFuncionario),
  });
  await handleApiError(response);
  return response.json();
};

/**
 * Envia os dados atualizados de um cliente para a API.
 * @param id - O ID do cliente a ser alterado.
 * @param data - Objeto com os dados do cliente e a senha do funcionário.
 */
export const updateCliente = async (
  id: string,
  data: { clienteData: UpdateClienteData; funcionarioSenha: string }
) => {
  const response = await fetch(`/api/funcionario/clientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleApiError(response);
  return response.json();
};

/**
 * Envia a requisição para encerrar todas as contas de um cliente.
 * @param id - O ID do cliente a ter as contas encerradas.
 * @param data - Objeto com a senha do gerente e o motivo.
 */
export const encerrarContaCliente = async (
  id: string,
  data: { gerenteSenha: string; motivo: string }
) => {
  const response = await fetch(`/api/funcionario/clientes/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleApiError(response);
  return response.json();
};
