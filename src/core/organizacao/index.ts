export {
  ESTADOS_ORGANIZACIONAIS,
  TIPOS_UNIDADE,
} from "./constants";
export type {
  EstadoOrganizacional,
  TipoUnidade,
} from "./constants";
export type {
  ContextoOrganizacional,
  ContextoOperacionalAtivo,
  Empresa,
  Unidade,
} from "./types";
export {
  obterContextoOrganizacional,
  obterEmpresaAtual,
  obterUnidadeAtual,
} from "./service";
