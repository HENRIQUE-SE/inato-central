import {
  detectarCamposAlteradosVeiculo,
  STATUS_VEICULO,
  validarDadosAtualizacaoVeiculo,
  validarDadosCriacaoVeiculo,
  validarTransicaoStatusVeiculo,
  type DadosAtualizacaoVeiculo,
  type DadosCriacaoVeiculo,
  type ListagemVeiculos,
  type Veiculo,
} from "@/core/veiculos";
import { CODIGOS_PERMISSAO_ACESSO, type ContextoAcesso } from "@/core/acesso";
import type { Oportunidade } from "@/types/oportunidade";
import { exigirPermissao } from "./acesso.service";
import { obterUsuarioAtualAutenticado, type UsuarioAutenticado } from "./auth.service";

export type DadosFormularioVeiculo = {
  oportunidadeId: string;
  proprietarioNome: string;
  placa: string;
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  quilometragem: number;
  renavam: string;
  chassi: string;
  codigoFipe: string;
};

export type DadosFormularioAtualizacaoVeiculo = Omit<
  DadosFormularioVeiculo,
  "oportunidadeId"
>;

export type OportunidadeParaVeiculo = Pick<
  Oportunidade,
  "id" | "proprietario_nome" | "veiculo_informado" | "placa"
>;

export type DependenciasVeiculos = {
  listar: () => Promise<ListagemVeiculos>;
  criar: (dados: DadosCriacaoVeiculo) => Promise<Veiculo>;
  obterPorId: (id: string) => Promise<Veiculo | null>;
  atualizar: (id: string, dados: DadosAtualizacaoVeiculo) => Promise<Veiculo | null>;
  marcarProntoParaAnunciar: (id: string) => Promise<Veiculo | null>;
  obterUsuario: () => Promise<UsuarioAutenticado | null>;
  exigirVisualizacao: () => Promise<ContextoAcesso>;
  exigirCriacao: () => Promise<ContextoAcesso>;
  exigirAlteracao: () => Promise<ContextoAcesso>;
  exigirConclusaoPreparacao: () => Promise<ContextoAcesso>;
  auditarCriacao: (veiculo: Veiculo) => Promise<void>;
  auditarAlteracao: (
    veiculo: Veiculo,
    camposAlterados: readonly string[]
  ) => Promise<void>;
  auditarConclusaoPreparacao: (
    veiculoAnterior: Veiculo,
    veiculoAtualizado: Veiculo
  ) => Promise<void>;
  listarOportunidades: () => Promise<Oportunidade[]>;
};

async function listarPersistidos(): Promise<ListagemVeiculos> {
  const { listarVeiculosPersistidos } = await import("@/lib/veiculos/veiculos.repository");
  return listarVeiculosPersistidos();
}

async function criarPersistido(dados: DadosCriacaoVeiculo): Promise<Veiculo> {
  const { criarVeiculoPersistido } = await import("@/lib/veiculos/veiculos.repository");
  return criarVeiculoPersistido(dados);
}

async function obterPersistidoPorId(id: string): Promise<Veiculo | null> {
  const { obterVeiculoPersistidoPorId } = await import("@/lib/veiculos/veiculos.repository");
  return obterVeiculoPersistidoPorId(id);
}

async function atualizarPersistido(
  id: string,
  dados: DadosAtualizacaoVeiculo
): Promise<Veiculo | null> {
  const { atualizarVeiculoPersistido } = await import("@/lib/veiculos/veiculos.repository");
  return atualizarVeiculoPersistido(id, dados);
}

async function marcarProntoParaAnunciarPersistido(id: string): Promise<Veiculo | null> {
  const { marcarVeiculoProntoParaAnunciarPersistido } = await import("@/lib/veiculos/veiculos.repository");
  return marcarVeiculoProntoParaAnunciarPersistido(id);
}

async function auditarCriacao(veiculo: Veiculo): Promise<void> {
  const { registrarAuditoriaCriacaoVeiculo } = await import("./veiculos.auditoria");
  return registrarAuditoriaCriacaoVeiculo(veiculo);
}

async function auditarAlteracao(
  veiculo: Veiculo,
  camposAlterados: readonly string[]
): Promise<void> {
  const { registrarAuditoriaAlteracaoVeiculo } = await import("./veiculos.auditoria");
  return registrarAuditoriaAlteracaoVeiculo(veiculo, camposAlterados);
}

async function auditarConclusaoPreparacao(
  veiculoAnterior: Veiculo,
  veiculoAtualizado: Veiculo
): Promise<void> {
  const { registrarAuditoriaConclusaoPreparacaoVeiculo } = await import("./veiculos.auditoria");
  return registrarAuditoriaConclusaoPreparacaoVeiculo(veiculoAnterior, veiculoAtualizado);
}

async function listarOportunidadesPublicas(): Promise<Oportunidade[]> {
  const { listarOportunidades } = await import("./oportunidades.service");
  return (await listarOportunidades({ itensPorPagina: 1000 })).dados;
}

const DEPENDENCIAS_PADRAO: DependenciasVeiculos = {
  listar: listarPersistidos,
  criar: criarPersistido,
  obterPorId: obterPersistidoPorId,
  atualizar: atualizarPersistido,
  marcarProntoParaAnunciar: marcarProntoParaAnunciarPersistido,
  obterUsuario: obterUsuarioAtualAutenticado,
  exigirVisualizacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR),
  exigirCriacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR),
  exigirAlteracao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR),
  exigirConclusaoPreparacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR),
  auditarCriacao,
  auditarAlteracao,
  auditarConclusaoPreparacao,
  listarOportunidades: listarOportunidadesPublicas,
};

function dependencias(complemento: Partial<DependenciasVeiculos>): DependenciasVeiculos {
  return { ...DEPENDENCIAS_PADRAO, ...complemento };
}

function opcional(valor: string): string | null {
  const normalizado = valor.trim();
  return normalizado || null;
}

function normalizarCamposEditaveis(
  dados: DadosFormularioAtualizacaoVeiculo
): DadosAtualizacaoVeiculo {
  return {
    proprietarioNome: dados.proprietarioNome.trim(),
    placa: dados.placa.trim().toUpperCase(),
    marca: dados.marca.trim(),
    modelo: dados.modelo.trim(),
    versao: opcional(dados.versao),
    anoFabricacao: dados.anoFabricacao,
    anoModelo: dados.anoModelo,
    cor: dados.cor.trim(),
    quilometragem: dados.quilometragem,
    renavam: opcional(dados.renavam),
    chassi: opcional(dados.chassi)?.toUpperCase() ?? null,
    codigoFipe: opcional(dados.codigoFipe),
  };
}

function normalizarDados(
  dados: DadosFormularioVeiculo,
  contexto: ContextoAcesso
): DadosCriacaoVeiculo {
  return {
    empresaId: contexto.vinculo.empresaId,
    unidadeId: contexto.vinculo.unidadeId ?? "",
    oportunidadeId: dados.oportunidadeId.trim(),
    ...normalizarCamposEditaveis(dados),
  };
}

function erroUnicidade(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function obterVeiculoPorId(
  id: string,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<Veiculo> {
  const deps = dependencias(complemento);
  if (await deps.obterUsuario() === null) throw new Error("Acesso não autorizado.");
  await deps.exigirVisualizacao();
  try {
    const veiculo = await deps.obterPorId(id);
    if (veiculo === null) throw new Error("nao encontrado");
    return veiculo;
  } catch {
    throw new Error("Veículo não encontrado.");
  }
}

export async function atualizarVeiculo(
  id: string,
  dadosFormulario: DadosFormularioAtualizacaoVeiculo,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<Veiculo> {
  const deps = dependencias(complemento);
  if (await deps.obterUsuario() === null) throw new Error("Acesso não autorizado.");
  await deps.exigirAlteracao();

  let anterior: Veiculo;
  try {
    const encontrado = await deps.obterPorId(id);
    if (encontrado === null) throw new Error("nao encontrado");
    anterior = encontrado;
  } catch {
    throw new Error("Veículo não encontrado.");
  }

  const dados = normalizarCamposEditaveis(dadosFormulario);
  const validacao = validarDadosAtualizacaoVeiculo(dados);
  if (!validacao.valido) throw new Error(validacao.mensagem);
  const camposAlterados = detectarCamposAlteradosVeiculo(anterior, dados);

  let atualizado: Veiculo | null;
  try {
    atualizado = await deps.atualizar(id, dados);
  } catch (error) {
    if (erroUnicidade(error)) throw new Error("Já existe outro veículo com esses dados.");
    throw new Error("Não foi possível atualizar o veículo.");
  }
  if (atualizado === null) throw new Error("Veículo não encontrado.");
  await deps.auditarAlteracao(atualizado, camposAlterados);
  return atualizado;
}

export async function obterOportunidadeOrigemDoVeiculo(
  oportunidadeId: string,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<OportunidadeParaVeiculo | null> {
  const deps = dependencias(complemento);
  await deps.exigirVisualizacao();
  try {
    const oportunidades = await deps.listarOportunidades();
    const oportunidade = oportunidades.find(({ id }) => id === oportunidadeId);
    if (!oportunidade) return null;
    const { id, proprietario_nome, veiculo_informado, placa } = oportunidade;
    return { id, proprietario_nome, veiculo_informado, placa };
  } catch {
    return null;
  }
}

export async function marcarVeiculoProntoParaAnunciar(
  id: string,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<Veiculo> {
  const deps = dependencias(complemento);
  if (await deps.obterUsuario() === null) throw new Error("Acesso não autorizado.");
  await deps.exigirConclusaoPreparacao();

  let anterior: Veiculo;
  try {
    const encontrado = await deps.obterPorId(id);
    if (encontrado === null) throw new Error("não encontrado");
    anterior = encontrado;
  } catch {
    throw new Error("Veículo não encontrado.");
  }

  if (anterior.arquivadoEm !== null) {
    throw new Error("O veículo não pode ser marcado como pronto para anunciar.");
  }
  const validacao = validarTransicaoStatusVeiculo(
    anterior.status,
    STATUS_VEICULO.PRONTO_PARA_ANUNCIAR
  );
  if (!validacao.valido) throw new Error(validacao.mensagem);

  let atualizado: Veiculo | null;
  try {
    atualizado = await deps.marcarProntoParaAnunciar(id);
  } catch {
    throw new Error("Não foi possível atualizar o status do veículo.");
  }
  if (atualizado === null) throw new Error("Não foi possível atualizar o status do veículo.");
  await deps.auditarConclusaoPreparacao(anterior, atualizado);
  return atualizado;
}

export async function listarVeiculos(
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<ListagemVeiculos> {
  const deps = dependencias(complemento);
  await deps.exigirVisualizacao();
  try {
    return await deps.listar();
  } catch {
    throw new Error("Não foi possível carregar os veículos.");
  }
}

export async function listarOportunidadesDisponiveisParaVeiculo(
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<OportunidadeParaVeiculo[]> {
  const deps = dependencias(complemento);
  await deps.exigirVisualizacao();
  try {
    const [oportunidades, veiculos] = await Promise.all([
      deps.listarOportunidades(),
      deps.listar(),
    ]);
    const vinculadas = new Set(veiculos.dados.map(({ oportunidadeId }) => oportunidadeId));
    return oportunidades
      .filter(({ id }) => !vinculadas.has(id))
      .map(({ id, proprietario_nome, veiculo_informado, placa }) => ({
        id, proprietario_nome, veiculo_informado, placa,
      }));
  } catch {
    throw new Error("Não foi possível carregar as oportunidades.");
  }
}

export async function criarVeiculo(
  dadosFormulario: DadosFormularioVeiculo,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<Veiculo> {
  const deps = dependencias(complemento);
  if (await deps.obterUsuario() === null) throw new Error("Acesso não autorizado.");
  const contexto = await deps.exigirCriacao();
  if (contexto.vinculo.unidadeId === null) throw new Error("Acesso não autorizado.");
  const dados = normalizarDados(dadosFormulario, contexto);
  const validacao = validarDadosCriacaoVeiculo(dados);
  if (!validacao.valido) throw new Error(validacao.mensagem);

  let veiculo: Veiculo;
  try {
    veiculo = await deps.criar(dados);
  } catch {
    throw new Error("Não foi possível cadastrar o veículo.");
  }
  await deps.auditarCriacao(veiculo);
  return veiculo;
}
