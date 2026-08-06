export {
  ACOES_AUDITORIA,
  ORIGENS_AUDITORIA,
  RESULTADOS_AUDITORIA,
} from "./constants";
export type {
  AcaoAuditoria,
  OrigemAuditoria,
  ResultadoAuditoria,
} from "./constants";
export type {
  EntradaRegistroAuditoria,
  RegistroAuditoria,
  ValorAuditoria,
} from "./types";
export {
  listarEventosAuditoria,
  obterEventoAuditoriaPorId,
  registrarEventoAuditoria,
} from "./service";
