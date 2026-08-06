import {
  obterEmpresaAtualInterna,
  obterUnidadeAtualInterna,
} from "./data";
import type { ContextoOrganizacional, Empresa, Unidade } from "./types";

export function obterEmpresaAtual(): Empresa {
  return { ...obterEmpresaAtualInterna() };
}

export function obterUnidadeAtual(): Unidade {
  return { ...obterUnidadeAtualInterna() };
}

export function obterContextoOrganizacional(): ContextoOrganizacional {
  const empresaAtual = obterEmpresaAtualInterna();
  const unidadeAtual = obterUnidadeAtualInterna();

  return {
    empresaId: empresaAtual.id,
    unidadeId: unidadeAtual.id,
  };
}
