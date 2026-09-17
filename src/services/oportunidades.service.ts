import { derivarContextoOperacionalAtivo, possuiPermissao, CODIGOS_PERMISSAO_ACESSO } from "@/core/acesso";
import type { CodigoPermissaoAcesso } from "@/core/acesso";
import type {
  ConsultaOportunidades,
  ResultadoOportunidadesPersistidas,
} from "@/lib/oportunidades/oportunidades.repository";
import type { DadosOportunidade, Oportunidade } from "@/types/oportunidade";
import { obterContextoAcessoAutenticadoAtual, type ContextoAcessoAutenticado } from "./acesso.service";
import {
  registrarAuditoriaAlteracaoOportunidade,
  registrarAuditoriaCriacaoOportunidade,
  registrarAuditoriaExclusaoOportunidade,
} from "./oportunidades.auditoria";

export type ListarOportunidadesParametros = {
  pagina?: number;
  itensPorPagina?: number;
  termoPesquisa?: string;
  status?: string;
};

export type ListarOportunidadesResultado = ResultadoOportunidadesPersistidas & {
  pagina: number;
  itensPorPagina: number;
  permissoes: {
    visualizar: boolean;
    criar: boolean;
    alterar: boolean;
    excluir: boolean;
  };
};

type Dependencias = {
  obterContexto: () => Promise<ContextoAcessoAutenticado | null>;
  obterPorId: (id: string) => Promise<Oportunidade | null>;
  listar: (consulta: ConsultaOportunidades) => Promise<ResultadoOportunidadesPersistidas>;
  criar: (dados: DadosOportunidade & { empresa_id: string; unidade_id: string }) => Promise<Oportunidade>;
  atualizar: (id: string, dados: DadosOportunidade) => Promise<Oportunidade>;
  excluir: (id: string) => Promise<Oportunidade>;
  auditarCriacao: (oportunidade: Oportunidade, contexto: ContextoAcessoAutenticado) => Promise<void>;
  auditarAlteracao: (oportunidade: Oportunidade, contexto: ContextoAcessoAutenticado) => Promise<void>;
  auditarExclusao: (oportunidade: Oportunidade, contexto: ContextoAcessoAutenticado) => Promise<void>;
};

const DEPENDENCIAS_PADRAO: Dependencias = {
  obterContexto: obterContextoAcessoAutenticadoAtual,
  obterPorId: async (id) => (await import("@/lib/oportunidades/oportunidades.repository")).obterOportunidadePersistidaPorId(id),
  listar: async (consulta) => (await import("@/lib/oportunidades/oportunidades.repository")).listarOportunidadesPersistidas(consulta),
  criar: async (dados) => (await import("@/lib/oportunidades/oportunidades.repository")).criarOportunidadePersistida(dados),
  atualizar: async (id, dados) => (await import("@/lib/oportunidades/oportunidades.repository")).atualizarOportunidadePersistida(id, dados),
  excluir: async (id) => (await import("@/lib/oportunidades/oportunidades.repository")).excluirOportunidadePersistida(id),
  auditarCriacao: (oportunidade, contexto) => registrarAuditoriaCriacaoOportunidade(oportunidade, undefined, contexto),
  auditarAlteracao: (oportunidade, contexto) => registrarAuditoriaAlteracaoOportunidade(oportunidade, undefined, contexto),
  auditarExclusao: (oportunidade, contexto) => registrarAuditoriaExclusaoOportunidade(oportunidade, undefined, contexto),
};

async function exigirContexto(
  permissao: CodigoPermissaoAcesso,
  dependencias: Dependencias
): Promise<ContextoAcessoAutenticado> {
  const contexto = await dependencias.obterContexto();
  if (
    contexto === null
    || !contexto.contexto.vinculo.ativo
    || !contexto.contexto.perfil.ativo
    || contexto.contexto.vinculo.usuarioId !== contexto.usuario.id
    || !possuiPermissao(contexto.contexto, permissao)
  ) {
    throw new Error("Acesso não autorizado.");
  }
  return contexto;
}

export async function obterOportunidadePorId(
  id: string,
  dependencias: Dependencias = DEPENDENCIAS_PADRAO
): Promise<Oportunidade | null> {
  return dependencias.obterPorId(id);
}

export async function listarOportunidades(
  {
    pagina = 1,
    itensPorPagina = 10,
    termoPesquisa = "",
    status = "todos",
  }: ListarOportunidadesParametros = {},
  dependencias: Dependencias = DEPENDENCIAS_PADRAO
): Promise<ListarOportunidadesResultado> {
  const contexto = await exigirContexto(
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR,
    dependencias
  );
  const resultado = await dependencias.listar({ pagina, itensPorPagina, termoPesquisa, status });
  return {
    ...resultado,
    pagina,
    itensPorPagina,
    permissoes: {
      visualizar: possuiPermissao(contexto.contexto, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR),
      criar: possuiPermissao(contexto.contexto, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR),
      alterar: possuiPermissao(contexto.contexto, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR),
      excluir: possuiPermissao(contexto.contexto, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR),
    },
  };
}

export async function criarOportunidade(
  dados: DadosOportunidade,
  dependencias: Dependencias = DEPENDENCIAS_PADRAO
): Promise<Oportunidade> {
  const contexto = await exigirContexto(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR, dependencias);
  const contextoOperacional = derivarContextoOperacionalAtivo(contexto.contexto.vinculo);
  if (contextoOperacional === null) throw new Error("Acesso não autorizado.");
  const oportunidade = await dependencias.criar({
    ...dados,
    empresa_id: contextoOperacional.empresaId,
    unidade_id: contextoOperacional.unidadeId,
  });
  await dependencias.auditarCriacao(oportunidade, contexto);
  return oportunidade;
}

export async function atualizarOportunidade(
  id: string,
  dados: DadosOportunidade,
  dependencias: Dependencias = DEPENDENCIAS_PADRAO
): Promise<Oportunidade> {
  const contexto = await exigirContexto(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR, dependencias);
  const oportunidade = await dependencias.atualizar(id, dados);
  await dependencias.auditarAlteracao(oportunidade, contexto);
  return oportunidade;
}

export async function excluirOportunidade(
  id: string,
  dependencias: Dependencias = DEPENDENCIAS_PADRAO
): Promise<void> {
  const contexto = await exigirContexto(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR, dependencias);
  const oportunidade = await dependencias.excluir(id);
  await dependencias.auditarExclusao(oportunidade, contexto);
}
