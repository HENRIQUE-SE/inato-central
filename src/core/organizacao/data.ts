import { ESTADOS_ORGANIZACIONAIS, TIPOS_UNIDADE } from "./constants";
import type { Empresa, Unidade } from "./types";

const empresaAtual = Object.freeze<Empresa>({
  id: "00000000-0000-4000-8000-000000000001",
  nomeFantasia: "INATO",
  razaoSocial: "",
  documento: "",
  email: "",
  telefone: "",
  pais: "BR",
  moeda: "BRL",
  fusoHorario: "America/Sao_Paulo",
  estado: ESTADOS_ORGANIZACIONAIS.ATIVO,
  criadoEm: "2026-08-06T00:00:00.000Z",
  atualizadoEm: "2026-08-06T00:00:00.000Z",
  arquivadoEm: null,
});

const unidadeAtual = Object.freeze<Unidade>({
  id: "00000000-0000-4000-8000-000000000002",
  empresaId: empresaAtual.id,
  nome: "Patrocínio",
  codigo: "",
  tipo: TIPOS_UNIDADE.MATRIZ,
  documento: "",
  email: "",
  telefone: "",
  cidade: "Patrocínio",
  estadoLocalizacao: "MG",
  pais: "BR",
  endereco: "",
  cep: "",
  estado: ESTADOS_ORGANIZACIONAIS.ATIVO,
  criadoEm: "2026-08-06T00:00:00.000Z",
  atualizadoEm: "2026-08-06T00:00:00.000Z",
  arquivadoEm: null,
});

export function obterEmpresaAtualInterna(): Readonly<Empresa> {
  return empresaAtual;
}

export function obterUnidadeAtualInterna(): Readonly<Unidade> {
  return unidadeAtual;
}
