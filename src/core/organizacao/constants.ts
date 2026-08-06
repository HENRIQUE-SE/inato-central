export const ESTADOS_ORGANIZACIONAIS = {
  ATIVO: "ativo",
  INATIVO: "inativo",
  ARQUIVADO: "arquivado",
} as const;

export type EstadoOrganizacional =
  (typeof ESTADOS_ORGANIZACIONAIS)[keyof typeof ESTADOS_ORGANIZACIONAIS];

export const TIPOS_UNIDADE = {
  MATRIZ: "matriz",
  FILIAL: "filial",
  FRANQUIA: "franquia",
  ESCRITORIO: "escritorio",
  PDV: "pdv",
  CENTRO_OPERACIONAL: "centro_operacional",
} as const;

export type TipoUnidade = (typeof TIPOS_UNIDADE)[keyof typeof TIPOS_UNIDADE];
