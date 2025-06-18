export interface DadosConta {
  numero_conta: string;
  saldo: number;
  tipo_conta: string;
  status: string;
  limite?: number;
  taxa_rendimento?: number;
}

export interface Transacao {
  id_transacao: number;
  id_conta_origem: number;
  id_conta_destino: number | null;
  tipo_transacao:
    | "DEPOSITO"
    | "SAQUE"
    | "TRANSFERENCIA"
    | "TAXA"
    | "RENDIMENTO";
  valor: number;
  data_hora: string;
  descricao: string | null;
}
