export const STATUS_OPORTUNIDADE = [
  "novo",
  "em_analise",
  "aprovado",
  "recusado",
] as const;

export const ORIGENS_OPORTUNIDADE = [
  "Instagram",
  "Facebook",
  "Indicação",
  "Site",
  "Outro",
] as const;

export const PAGINACAO_OPORTUNIDADES = {
  ITENS_POR_PAGINA: 10,
};

export const ORDENACAO_PADRAO = {
  CAMPO: "created_at",
  ASCENDENTE: false,
};