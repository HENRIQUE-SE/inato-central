export const ESTADOS_IDENTIDADE = {
  ATIVO: "ativo",
  INATIVO: "inativo",
  BLOQUEADO: "bloqueado",
  ARQUIVADO: "arquivado",
} as const;

export type EstadoIdentidade =
  (typeof ESTADOS_IDENTIDADE)[keyof typeof ESTADOS_IDENTIDADE];

export const CODIGOS_PERFIL_IDENTIDADE = {
  ADMINISTRADOR: "administrador",
  CONSULTOR: "consultor",
  FINANCEIRO: "financeiro",
  TESTE: "teste",
} as const;

export type CodigoPerfilIdentidade =
  (typeof CODIGOS_PERFIL_IDENTIDADE)[keyof typeof CODIGOS_PERFIL_IDENTIDADE];

export const ESTADOS_SESSAO_IDENTIDADE = {
  ATIVA: "ativa",
  ENCERRADA: "encerrada",
  EXPIRADA: "expirada",
} as const;

export type EstadoSessaoIdentidade =
  (typeof ESTADOS_SESSAO_IDENTIDADE)[keyof typeof ESTADOS_SESSAO_IDENTIDADE];
