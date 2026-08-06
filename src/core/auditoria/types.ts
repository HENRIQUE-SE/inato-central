import type {
  AcaoAuditoria,
  OrigemAuditoria,
  ResultadoAuditoria,
} from "./constants";

export type ValorAuditoria =
  | string
  | number
  | boolean
  | null
  | Readonly<{ [chave: string]: ValorAuditoria }>
  | readonly ValorAuditoria[];

export type RegistroAuditoria = {
  id: string;
  empresaId: string;
  unidadeId: string | null;
  usuarioId: string | null;
  modulo: string;
  acao: AcaoAuditoria;
  recursoTipo: string;
  recursoId: string | null;
  resultado: ResultadoAuditoria;
  origem: OrigemAuditoria;
  detalhes: Readonly<Record<string, ValorAuditoria>> | null;
  criadoEm: string;
};

export type EntradaRegistroAuditoria = Omit<
  RegistroAuditoria,
  "id" | "criadoEm"
>;
