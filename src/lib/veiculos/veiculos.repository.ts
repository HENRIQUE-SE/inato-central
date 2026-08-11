import {
  criarListagemVeiculos,
  type DadosAtualizacaoVeiculo,
  type DadosCriacaoVeiculo,
  type ListagemVeiculos,
  type Veiculo,
} from "@/core/veiculos";
import { supabase } from "@/lib/supabase";

type LinhaVeiculo = {
  id: string;
  empresa_id: string;
  unidade_id: string;
  oportunidade_id: string;
  proprietario_nome: string;
  placa: string;
  renavam: string | null;
  chassi: string | null;
  marca: string;
  modelo: string;
  versao: string | null;
  ano_fabricacao: number;
  ano_modelo: number;
  cor: string;
  quilometragem: number;
  codigo_fipe: string | null;
  status: Veiculo["status"];
  criado_em: string;
  atualizado_em: string;
  arquivado_em: string | null;
};

type ResultadoConsultaVeiculos = {
  data: LinhaVeiculo[] | null;
  error: unknown;
};

type ExecutarConsultaVeiculos = () => Promise<ResultadoConsultaVeiculos>;
type ResultadoCriacaoVeiculo = { data: LinhaVeiculo | null; error: unknown };
type ExecutarCriacaoVeiculo = (
  dados: Record<string, string | number | null>
) => Promise<ResultadoCriacaoVeiculo>;
type ResultadoVeiculo = { data: LinhaVeiculo | null; error: unknown };
type ExecutarObtencaoVeiculo = (id: string) => Promise<ResultadoVeiculo>;
type ExecutarAtualizacaoVeiculo = (
  id: string,
  dados: Record<string, string | number | null>
) => Promise<ResultadoVeiculo>;
type ParametrosMarcarProntoParaAnunciar = { p_veiculo_id: string };
type ExecutarTransicaoProntoParaAnunciar = (
  parametros: ParametrosMarcarProntoParaAnunciar
) => Promise<ResultadoVeiculo>;
type ParametrosMarcarDisponivel = { p_veiculo_id: string };
type ExecutarTransicaoDisponivel = (
  parametros: ParametrosMarcarDisponivel
) => Promise<ResultadoVeiculo>;

function mapearVeiculo(linha: LinhaVeiculo): Veiculo {
  return {
    id: linha.id,
    empresaId: linha.empresa_id,
    unidadeId: linha.unidade_id,
    oportunidadeId: linha.oportunidade_id,
    proprietarioNome: linha.proprietario_nome,
    placa: linha.placa,
    renavam: linha.renavam,
    chassi: linha.chassi,
    marca: linha.marca,
    modelo: linha.modelo,
    versao: linha.versao,
    anoFabricacao: linha.ano_fabricacao,
    anoModelo: linha.ano_modelo,
    cor: linha.cor,
    quilometragem: linha.quilometragem,
    codigoFipe: linha.codigo_fipe,
    status: linha.status,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    arquivadoEm: linha.arquivado_em,
  };
}

async function consultarVeiculos(): Promise<ResultadoConsultaVeiculos> {
  return supabase
    .from("veiculos")
    .select("*")
    .is("arquivado_em", null)
    .order("criado_em", { ascending: false });
}

async function inserirVeiculo(
  dados: Record<string, string | number | null>
): Promise<ResultadoCriacaoVeiculo> {
  return supabase.from("veiculos").insert(dados).select("*").single();
}

async function consultarVeiculoPorId(id: string): Promise<ResultadoVeiculo> {
  return supabase
    .from("veiculos")
    .select("*")
    .eq("id", id)
    .is("arquivado_em", null)
    .maybeSingle();
}

async function atualizarVeiculo(
  id: string,
  dados: Record<string, string | number | null>
): Promise<ResultadoVeiculo> {
  return supabase
    .from("veiculos")
    .update(dados)
    .eq("id", id)
    .is("arquivado_em", null)
    .select("*")
    .maybeSingle();
}

async function executarTransicaoProntoParaAnunciar(
  parametros: ParametrosMarcarProntoParaAnunciar
): Promise<ResultadoVeiculo> {
  return supabase
    .rpc("marcar_veiculo_pronto_para_anunciar", parametros)
    .single();
}

async function executarTransicaoDisponivel(
  parametros: ParametrosMarcarDisponivel
): Promise<ResultadoVeiculo> {
  return supabase
    .rpc("marcar_veiculo_disponivel", parametros)
    .single();
}

export async function listarVeiculosPersistidos(
  executarConsulta: ExecutarConsultaVeiculos = consultarVeiculos
): Promise<ListagemVeiculos> {
  const { data, error } = await executarConsulta();
  if (error) throw error;
  return criarListagemVeiculos((data ?? []).map(mapearVeiculo));
}

export async function criarVeiculoPersistido(
  dados: DadosCriacaoVeiculo,
  executarCriacao: ExecutarCriacaoVeiculo = inserirVeiculo
): Promise<Veiculo> {
  const registro = {
    empresa_id: dados.empresaId,
    unidade_id: dados.unidadeId,
    oportunidade_id: dados.oportunidadeId,
    proprietario_nome: dados.proprietarioNome,
    placa: dados.placa,
    renavam: dados.renavam,
    chassi: dados.chassi,
    marca: dados.marca,
    modelo: dados.modelo,
    versao: dados.versao,
    ano_fabricacao: dados.anoFabricacao,
    ano_modelo: dados.anoModelo,
    cor: dados.cor,
    quilometragem: dados.quilometragem,
    codigo_fipe: dados.codigoFipe,
  };
  const { data, error } = await executarCriacao(registro);
  if (error) throw error;
  if (data === null) throw new Error("Veículo não retornado após criação.");
  return mapearVeiculo(data);
}

export async function obterVeiculoPersistidoPorId(
  id: string,
  executarObtencao: ExecutarObtencaoVeiculo = consultarVeiculoPorId
): Promise<Veiculo | null> {
  const { data, error } = await executarObtencao(id);
  if (error) throw error;
  return data === null ? null : mapearVeiculo(data);
}

export async function atualizarVeiculoPersistido(
  id: string,
  dados: DadosAtualizacaoVeiculo,
  executarAtualizacao: ExecutarAtualizacaoVeiculo = atualizarVeiculo
): Promise<Veiculo | null> {
  const registro = {
    proprietario_nome: dados.proprietarioNome,
    placa: dados.placa,
    marca: dados.marca,
    modelo: dados.modelo,
    versao: dados.versao,
    ano_fabricacao: dados.anoFabricacao,
    ano_modelo: dados.anoModelo,
    cor: dados.cor,
    quilometragem: dados.quilometragem,
    renavam: dados.renavam,
    chassi: dados.chassi,
    codigo_fipe: dados.codigoFipe,
    atualizado_em: new Date().toISOString(),
  };
  const { data, error } = await executarAtualizacao(id, registro);
  if (error) throw error;
  return data === null ? null : mapearVeiculo(data);
}

export async function marcarVeiculoProntoParaAnunciarPersistido(
  id: string,
  executarTransicao: ExecutarTransicaoProntoParaAnunciar = executarTransicaoProntoParaAnunciar
): Promise<Veiculo | null> {
  const { data, error } = await executarTransicao({ p_veiculo_id: id });
  if (error) throw error;
  return data === null ? null : mapearVeiculo(data);
}

export async function marcarVeiculoDisponivelPersistido(
  id: string,
  executarTransicao: ExecutarTransicaoDisponivel = executarTransicaoDisponivel
): Promise<Veiculo | null> {
  const { data, error } = await executarTransicao({ p_veiculo_id: id });
  if (error) throw error;
  return data === null ? null : mapearVeiculo(data);
}
