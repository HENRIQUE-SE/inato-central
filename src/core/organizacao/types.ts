import type { EstadoOrganizacional, TipoUnidade } from "./constants";

export type Empresa = {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  documento: string;
  email: string;
  telefone: string;
  pais: string;
  moeda: string;
  fusoHorario: string;
  estado: EstadoOrganizacional;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
};

export type Unidade = {
  id: string;
  empresaId: string;
  nome: string;
  codigo: string;
  tipo: TipoUnidade;
  documento: string;
  email: string;
  telefone: string;
  cidade: string;
  estadoLocalizacao: string;
  pais: string;
  endereco: string;
  cep: string;
  estado: EstadoOrganizacional;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
};

export type ContextoOrganizacional = {
  empresaId: string;
  unidadeId: string | null;
};
