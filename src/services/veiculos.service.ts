import {
  validarDadosCriacaoVeiculo,
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

export type OportunidadeParaVeiculo = Pick<
  Oportunidade,
  "id" | "proprietario_nome" | "veiculo_informado" | "placa"
>;

export type DependenciasVeiculos = {
  listar: () => Promise<ListagemVeiculos>;
  criar: (dados: DadosCriacaoVeiculo) => Promise<Veiculo>;
  obterUsuario: () => Promise<UsuarioAutenticado | null>;
  exigirVisualizacao: () => Promise<ContextoAcesso>;
  exigirCriacao: () => Promise<ContextoAcesso>;
  auditarCriacao: (veiculo: Veiculo) => Promise<void>;
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

async function auditarCriacao(veiculo: Veiculo): Promise<void> {
  const { registrarAuditoriaCriacaoVeiculo } = await import("./veiculos.auditoria");
  return registrarAuditoriaCriacaoVeiculo(veiculo);
}

async function listarOportunidadesPublicas(): Promise<Oportunidade[]> {
  const { listarOportunidades } = await import("./oportunidades.service");
  return (await listarOportunidades({ itensPorPagina: 1000 })).dados;
}

const DEPENDENCIAS_PADRAO: DependenciasVeiculos = {
  listar: listarPersistidos,
  criar: criarPersistido,
  obterUsuario: obterUsuarioAtualAutenticado,
  exigirVisualizacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR),
  exigirCriacao: () => exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR),
  auditarCriacao,
  listarOportunidades: listarOportunidadesPublicas,
};

function dependencias(complemento: Partial<DependenciasVeiculos>): DependenciasVeiculos {
  return { ...DEPENDENCIAS_PADRAO, ...complemento };
}

function opcional(valor: string): string | null {
  const normalizado = valor.trim();
  return normalizado || null;
}

function normalizarDados(
  dados: DadosFormularioVeiculo,
  contexto: ContextoAcesso
): DadosCriacaoVeiculo {
  return {
    empresaId: contexto.vinculo.empresaId,
    unidadeId: contexto.vinculo.unidadeId ?? "",
    oportunidadeId: dados.oportunidadeId.trim(),
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
