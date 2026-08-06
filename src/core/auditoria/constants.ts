export const ACOES_AUDITORIA = {
  CRIAR: "criar",
  ALTERAR: "alterar",
  EXCLUIR: "excluir",
  VISUALIZAR: "visualizar",
  ENTRAR: "entrar",
  SAIR: "sair",
} as const;

export type AcaoAuditoria =
  (typeof ACOES_AUDITORIA)[keyof typeof ACOES_AUDITORIA];

export const RESULTADOS_AUDITORIA = {
  SUCESSO: "sucesso",
  FALHA: "falha",
} as const;

export type ResultadoAuditoria =
  (typeof RESULTADOS_AUDITORIA)[keyof typeof RESULTADOS_AUDITORIA];

export const ORIGENS_AUDITORIA = {
  SISTEMA: "sistema",
  USUARIO: "usuario",
  INTEGRACAO: "integracao",
} as const;

export type OrigemAuditoria =
  (typeof ORIGENS_AUDITORIA)[keyof typeof ORIGENS_AUDITORIA];
