import {
  detectarCamposAlteradosVeiculo,
  STATUS_VEICULO,
  validarDadosAtualizacaoVeiculo,
  validarDadosCriacaoVeiculo,
  validarTransicaoStatusVeiculo,
  type DadosAtualizacaoVeiculo,
  type DadosCriacaoVeiculo,
  type ListagemResumidaVeiculos,
  type ListagemVeiculos,
  type Veiculo,
  type VeiculoListagem,
} from "@/core/veiculos";
import type { OportunidadeDisponivelParaVeiculo } from "@/core/veiculos/types";
import {
  CODIGOS_PERMISSAO_ACESSO,
  derivarContextoOperacionalAtivo,
  possuiPermissao,
  type ContextoAcesso,
} from "@/core/acesso";
import {
  exigirPermissao,
  obterContextoAcessoAutenticadoAtual,
  type ContextoAcessoAutenticado,
} from "./acesso.service";
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

export type OportunidadeParaVeiculo = OportunidadeDisponivelParaVeiculo;

export type FichaVeiculo = {
  veiculo: Veiculo;
  oportunidade: OportunidadeParaVeiculo | null;
  permissoes: {
    editar: boolean;
    concluirPreparacao: boolean;
    concluirPublicacao: boolean;
  };
};

export type ResultadoAberturaListagemVeiculos =
  | { estado: "nao_autenticado" }
  | { estado: "acesso_negado" }
  | {
      estado: "carregado";
      veiculos: readonly VeiculoListagem[];
      permissoes: { criar: boolean };
    };

export type DependenciasVeiculos = {
  listar: () => Promise<ListagemVeiculos>;
  listarResumo: () => Promise<ListagemResumidaVeiculos>;
  criar: (dados: DadosCriacaoVeiculo) => Promise<Veiculo>;
  obterPorId: (id: string) => Promise<Veiculo | null>;
  obterFichaPorId: (id: string) => Promise<{
    veiculo: Veiculo;
    oportunidade: OportunidadeParaVeiculo | null;
  } | null>;
  atualizar: (id: string, dados: DadosAtualizacaoVeiculo) => Promise<Veiculo | null>;
  marcarProntoParaAnunciar: (id: string) => Promise<Veiculo | null>;
  marcarDisponivel: (id: string) => Promise<Veiculo | null>;
  obterUsuario: () => Promise<UsuarioAutenticado | null>;
  obterAutoridade: () => Promise<ContextoAcessoAutenticado | null>;
  exigirVisualizacao: () => Promise<ContextoAcesso>;
  exigirCriacao: () => Promise<ContextoAcesso>;
  exigirAlteracao: () => Promise<ContextoAcesso>;
  exigirConclusaoPreparacao: () => Promise<ContextoAcesso>;
  exigirConclusaoPublicacao: () => Promise<ContextoAcesso>;
  auditarCriacao: (veiculo: Veiculo) => Promise<void>;
  auditarAlteracao: (
    veiculo: Veiculo,
    camposAlterados: readonly string[]
  ) => Promise<void>;
  auditarConclusaoPreparacao: (
    veiculoAnterior: Veiculo,
    veiculoAtualizado: Veiculo
  ) => Promise<void>;
  auditarConclusaoPublicacao: (
    veiculoAnterior: Veiculo,
    veiculoAtualizado: Veiculo
  ) => Promise<void>;
  listarOportunidadesDisponiveis: () => Promise<readonly OportunidadeDisponivelParaVeiculo[]>;
};

async function listarPersistidos(): Promise<ListagemVeiculos> {
  const { listarVeiculosPersistidos } = await import("@/lib/veiculos/veiculos.repository");
  return listarVeiculosPersistidos();
}

async function listarResumoPersistido(): Promise<ListagemResumidaVeiculos> {
  const { listarResumoVeiculosPersistidos } = await import("@/lib/veiculos/veiculos.repository");
  return listarResumoVeiculosPersistidos();
}

async function criarPersistido(dados: DadosCriacaoVeiculo): Promise<Veiculo> {
  const { criarVeiculoPersistido } = await import("@/lib/veiculos/veiculos.repository");
  return criarVeiculoPersistido(dados);
}

async function obterPersistidoPorId(id: string): Promise<Veiculo | null> {
  const { obterVeiculoPersistidoPorId } = await import("@/lib/veiculos/veiculos.repository");
  return obterVeiculoPersistidoPorId(id);
}

async function obterFichaPersistidaPorId(id: string): Promise<{
  veiculo: Veiculo;
  oportunidade: OportunidadeParaVeiculo | null;
} | null> {
  const { obterFichaVeiculoPersistidaPorId } = await import("@/lib/veiculos/veiculos.repository");
  return obterFichaVeiculoPersistidaPorId(id);
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

async function marcarDisponivelPersistido(id: string): Promise<Veiculo | null> {
  const { marcarVeiculoDisponivelPersistido } = await import("@/lib/veiculos/veiculos.repository");
  return marcarVeiculoDisponivelPersistido(id);
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

async function auditarConclusaoPublicacao(
  veiculoAnterior: Veiculo,
  veiculoAtualizado: Veiculo
): Promise<void> {
  const { registrarAuditoriaConclusaoPublicacaoVeiculo } = await import("./veiculos.auditoria");
  return registrarAuditoriaConclusaoPublicacaoVeiculo(veiculoAnterior, veiculoAtualizado);
}

async function listarOportunidadesDisponiveisPersistidas(): Promise<readonly OportunidadeDisponivelParaVeiculo[]> {
  const { listarOportunidadesDisponiveisParaVeiculoPersistidas } = await import("@/lib/veiculos/veiculos.repository");
  return listarOportunidadesDisponiveisParaVeiculoPersistidas();
}

const DEPENDENCIAS_PADRAO: DependenciasVeiculos = {
  listar: listarPersistidos,
  listarResumo: listarResumoPersistido,
  criar: criarPersistido,
  obterPorId: obterPersistidoPorId,
  obterFichaPorId: obterFichaPersistidaPorId,
  atualizar: atualizarPersistido,
  marcarProntoParaAnunciar: marcarProntoParaAnunciarPersistido,
  marcarDisponivel: marcarDisponivelPersistido,
  obterUsuario: obterUsuarioAtualAutenticado,
  obterAutoridade: () => obterContextoAcessoAutenticadoAtual(),
  exigirVisualizacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR),
  exigirCriacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR),
  exigirAlteracao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR),
  exigirConclusaoPreparacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR),
  exigirConclusaoPublicacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR),
  auditarCriacao,
  auditarAlteracao,
  auditarConclusaoPreparacao,
  auditarConclusaoPublicacao,
  listarOportunidadesDisponiveis: listarOportunidadesDisponiveisPersistidas,
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
  const contextoOperacional = derivarContextoOperacionalAtivo(contexto.vinculo);
  if (contextoOperacional === null) throw new Error("Acesso não autorizado.");
  return {
    empresaId: contextoOperacional.empresaId,
    unidadeId: contextoOperacional.unidadeId,
    oportunidadeId: dados.oportunidadeId.trim(),
    ...normalizarCamposEditaveis(dados),
  };
}

function erroUnicidade(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

async function obterVeiculoPorIdComContexto(
  id: string,
  deps: DependenciasVeiculos
): Promise<Veiculo> {
  try {

    const veiculo = await deps.obterPorId(id);

    if (veiculo === null) throw new Error("nao encontrado");
    return veiculo;
  } catch {
    throw new Error("Veículo não encontrado.");
  }
}

export async function obterFichaVeiculoPorId(
  id: string,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<FichaVeiculo> {
  const deps = dependencias(complemento);


  const contexto = await deps.exigirVisualizacao();




  let fichaPersistida: Awaited<ReturnType<DependenciasVeiculos["obterFichaPorId"]>>;
  try {
    fichaPersistida = await deps.obterFichaPorId(id);
  } catch {
    throw new Error("Veículo não encontrado.");
  }

  if (fichaPersistida === null) throw new Error("Veículo não encontrado.");
  const { veiculo, oportunidade } = fichaPersistida;

  return {
    veiculo,
    oportunidade,
    permissoes: {
      editar: possuiPermissao(
        contexto,
        CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR
      ),
      concluirPreparacao: possuiPermissao(
        contexto,
        CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR
      ),
      concluirPublicacao: possuiPermissao(
        contexto,
        CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR
      ),
    },
  };
}

export function criarCarregadorFichaVeiculo(
  carregar: (id: string) => Promise<FichaVeiculo> = obterFichaVeiculoPorId
): (id: string) => Promise<FichaVeiculo> {
  const carregamentosEmAndamento = new Map<string, Promise<FichaVeiculo>>();
  return (id) => {
    const existente = carregamentosEmAndamento.get(id);
    if (existente) return existente;

    const carregamento = carregar(id).finally(() => {
      if (carregamentosEmAndamento.get(id) === carregamento) {
        carregamentosEmAndamento.delete(id);
      }
    });
    carregamentosEmAndamento.set(id, carregamento);
    return carregamento;
  };
}

export async function obterVeiculoPorId(
  id: string,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<Veiculo> {
  const deps = dependencias(complemento);
  await deps.exigirVisualizacao();
  return obterVeiculoPorIdComContexto(id, deps);
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
  if (!validacao.valido) throw new Error("O veículo não pode ser marcado como pronto para anunciar.");

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

export async function marcarVeiculoDisponivel(
  id: string,
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<Veiculo> {
  const deps = dependencias(complemento);
  if (await deps.obterUsuario() === null) throw new Error("Acesso não autorizado.");
  await deps.exigirConclusaoPublicacao();

  let anterior: Veiculo;
  try {
    const encontrado = await deps.obterPorId(id);
    if (encontrado === null) throw new Error("não encontrado");
    anterior = encontrado;
  } catch {
    throw new Error("Veículo não encontrado.");
  }

  if (anterior.arquivadoEm !== null) {
    throw new Error("O veículo não pode ser marcado como disponível.");
  }
  const validacao = validarTransicaoStatusVeiculo(
    anterior.status,
    STATUS_VEICULO.DISPONIVEL
  );
  if (!validacao.valido) throw new Error("O veículo não pode ser marcado como disponível.");

  let atualizado: Veiculo | null;
  try {
    atualizado = await deps.marcarDisponivel(id);
  } catch {
    throw new Error("Não foi possível atualizar o status do veículo.");
  }
  if (atualizado === null) throw new Error("Não foi possível atualizar o status do veículo.");
  await deps.auditarConclusaoPublicacao(anterior, atualizado);
  return atualizado;
}

export async function listarVeiculos(
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<ListagemVeiculos> {
  const deps = dependencias(complemento);

  await deps.exigirVisualizacao();

  try {

    const listagem = await deps.listar();

    return listagem;
  } catch {
    throw new Error("Não foi possível carregar os veículos.");
  }
}

export async function abrirListagemVeiculos(
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<ResultadoAberturaListagemVeiculos> {

  const deps = dependencias(complemento);


  const autoridade = await deps.obterAutoridade();

  if (autoridade === null) return { estado: "nao_autenticado" };
  if (!possuiPermissao(autoridade.contexto, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR)) {
    return { estado: "acesso_negado" };
  }

  let listagem: ListagemResumidaVeiculos;
  try {
    listagem = await deps.listarResumo();
  } catch {
    throw new Error("Não foi possível carregar os veículos.");
  }

  const resultado: ResultadoAberturaListagemVeiculos = {
    estado: "carregado",
    veiculos: listagem.dados,
    permissoes: {
      criar: possuiPermissao(
        autoridade.contexto,
        CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR
      ),
    },
  };

  return resultado;
}

export function criarCarregadorListagemVeiculos(
  carregar: () => Promise<ResultadoAberturaListagemVeiculos> = abrirListagemVeiculos
): () => Promise<ResultadoAberturaListagemVeiculos> {
  let carregamentoEmAndamento: Promise<ResultadoAberturaListagemVeiculos> | null = null;
  return () => {
    if (carregamentoEmAndamento !== null) return carregamentoEmAndamento;
    const atual = carregar().finally(() => {
      if (carregamentoEmAndamento === atual) carregamentoEmAndamento = null;
    });
    carregamentoEmAndamento = atual;
    return atual;
  };
}

export async function listarOportunidadesDisponiveisParaVeiculo(
  complemento: Partial<DependenciasVeiculos> = {}
): Promise<OportunidadeParaVeiculo[]> {
  const deps = dependencias(complemento);
  await deps.exigirVisualizacao();
  try {
    return [...await deps.listarOportunidadesDisponiveis()];
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
