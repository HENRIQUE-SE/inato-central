export const STATUS_NEGOCIACAO = {
  EM_ANDAMENTO: "em_andamento",
  CONVERTIDA: "convertida",
  PERDIDA: "perdida",
  CANCELADA: "cancelada",
} as const;
export type StatusNegociacao = (typeof STATUS_NEGOCIACAO)[keyof typeof STATUS_NEGOCIACAO];

export const ORIGENS_NEGOCIACAO = {
  WHATSAPP: "whatsapp",
  TELEFONE: "telefone",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  SITE: "site",
  INDICACAO: "indicacao",
  PRESENCIAL: "presencial",
  OUTRO: "outro",
} as const;
export type OrigemNegociacao = (typeof ORIGENS_NEGOCIACAO)[keyof typeof ORIGENS_NEGOCIACAO];

export const ROTULOS_STATUS_NEGOCIACAO: Readonly<Record<StatusNegociacao, string>> = {
  em_andamento: "Em andamento", convertida: "Convertida", perdida: "Perdida", cancelada: "Cancelada",
};
export const ROTULOS_ORIGEM_NEGOCIACAO: Readonly<Record<OrigemNegociacao, string>> = {
  whatsapp: "WhatsApp", telefone: "Telefone", instagram: "Instagram", facebook: "Facebook",
  site: "Site", indicacao: "Indicação", presencial: "Presencial", outro: "Outro",
};
