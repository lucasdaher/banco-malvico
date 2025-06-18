/**
 * Função que formata o valor passado para o valor de moeda do país especificado.
 * @param valor Valor que será formatado
 * @returns Valor formatado para a moeda especificada
 */
export const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};
