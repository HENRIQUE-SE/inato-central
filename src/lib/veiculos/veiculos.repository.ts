import {
  criarListagemVeiculos,
  type DadosAtualizacaoVeiculo,
  type DadosCriacaoVeiculo,
  type ListagemVeiculos,
  type ListagemResumidaVeiculos,
  type Veiculo,
  type VeiculoListagem,
} from "@/core/veiculos";
import type { OportunidadeDisponivelParaVeiculo } from "@/core/veiculos/types";
import { supabase } from "@/lib/supabase";
import type { ContextoOperacionalAtivo } from "@/core/organizacao";

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
type LinhaVeiculoListagem = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  versao: string | null;
  ano_fabricacao: number;
  ano_modelo: number;
  quilometragem: number;
  proprietario_nome: string;
  status: Veiculo["status"];
};
type ResultadoConsultaResumoVeiculos = {
  data: LinhaVeiculoListagem[] | null;
  error: unknown;
};
type ExecutarConsultaResumoVeiculos = () => Promise<ResultadoConsultaResumoVeiculos>;
type LinhaOportunidadeDisponivel = OportunidadeDisponivelParaVeiculo & {
  veiculos_vinculados: readonly [];
};
type ResultadoConsultaOportunidadesDisponiveis = {
  data: LinhaOportunidadeDisponivel[] | null;
  error: unknown;
};
type ExecutarConsultaOportunidadesDisponiveis = () => Promise<ResultadoConsultaOportunidadesDisponiveis>;
type ResultadoCriacaoVeiculo = { data: LinhaVeiculo | null; error: unknown };
type ExecutarCriacaoVeiculo = (
  dados: Record<string, string | number | null>
) => Promise<ResultadoCriacaoVeiculo>;
type ResultadoVeiculo = { data: LinhaVeiculo | null; error: unknown };
type ExecutarObtencaoVeiculo = (id: string) => Promise<ResultadoVeiculo>;
type LinhaFichaVeiculo = LinhaVeiculo & {
  oportunidade: OportunidadeDisponivelParaVeiculo | null;
};
type ResultadoConsultaFichaVeiculo = {
  data: LinhaFichaVeiculo | null;
  error: unknown;
};
type ExecutarConsultaFichaVeiculo = (
  id: string
) => Promise<ResultadoConsultaFichaVeiculo>;
export type FichaVeiculoPersistida = Readonly<{
  veiculo: Veiculo;
  oportunidade: OportunidadeDisponivelParaVeiculo | null;
}>;
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

function exigirContexto(
  contexto: ContextoOperacionalAtivo | undefined
): ContextoOperacionalAtivo {
  if (contexto === undefined) throw new Error("Contexto operacional não selecionado.");
  return contexto;
}

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

async function consultarVeiculos(contexto: ContextoOperacionalAtivo): Promise<ResultadoConsultaVeiculos> {
  return supabase
    .from("veiculos")
    .select("*")
    .eq("empresa_id", contexto.empresaId)
    .eq("unidade_id", contexto.unidadeId)
    .is("arquivado_em", null)
    .order("criado_em", { ascending: false });
}

async function consultarResumoVeiculos(contexto: ContextoOperacionalAtivo): Promise<ResultadoConsultaResumoVeiculos> {
  return supabase
    .from("veiculos")
    .select("id, placa, marca, modelo, versao, ano_fabricacao, ano_modelo, quilometragem, proprietario_nome, status")
    .eq("empresa_id", contexto.empresaId)
    .eq("unidade_id", contexto.unidadeId)
    .is("arquivado_em", null)
    .order("criado_em", { ascending: false });
}

async function consultarOportunidadesDisponiveis(contexto: ContextoOperacionalAtivo): Promise<ResultadoConsultaOportunidadesDisponiveis> {
  const { data, error } = await supabase
    .from("oportunidades")
    .select(`
      id,
      proprietario_nome,
      veiculo_informado,
      placa,
      veiculos_vinculados:veiculos!veiculos_oportunidade_fk(id)
    `)
    .eq("empresa_id", contexto.empresaId)
    .eq("unidade_id", contexto.unidadeId)
    .is("veiculos_vinculados.arquivado_em", null)
    .is("veiculos_vinculados", null)
    .order("created_at", { ascending: false });
  return {
    data: data as unknown as LinhaOportunidadeDisponivel[] | null,
    error,
  };
}

function mapearVeiculoListagem(linha: LinhaVeiculoListagem): VeiculoListagem {
  return Object.freeze({
    id: linha.id,
    placa: linha.placa,
    marca: linha.marca,
    modelo: linha.modelo,
    versao: linha.versao,
    anoFabricacao: linha.ano_fabricacao,
    anoModelo: linha.ano_modelo,
    quilometragem: linha.quilometragem,
    proprietarioNome: linha.proprietario_nome,
    status: linha.status,
  });
}

async function inserirVeiculo(
  dados: Record<string, string | number | null>
): Promise<ResultadoCriacaoVeiculo> {
  return supabase.from("veiculos").insert(dados).select("*").single();
}

async function consultarVeiculoPorId(id: string, contexto: ContextoOperacionalAtivo): Promise<ResultadoVeiculo> {
  return supabase
    .from("veiculos")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", contexto.empresaId)
    .eq("unidade_id", contexto.unidadeId)
    .is("arquivado_em", null)
    .maybeSingle();
}

async function consultarFichaVeiculoPorId(
  id: string,
  contexto: ContextoOperacionalAtivo
): Promise<ResultadoConsultaFichaVeiculo> {
  const { data, error } = await supabase
    .from("veiculos")
    .select(`
      id,
      empresa_id,
      unidade_id,
      oportunidade_id,
      proprietario_nome,
      placa,
      renavam,
      chassi,
      marca,
      modelo,
      versao,
      ano_fabricacao,
      ano_modelo,
      cor,
      quilometragem,
      codigo_fipe,
      status,
      criado_em,
      atualizado_em,
      arquivado_em,
      oportunidade:oportunidades!veiculos_oportunidade_fk(
        id,
        proprietario_nome,
        veiculo_informado,
        placa
      )
    `)
    .eq("id", id)
    .eq("empresa_id", contexto.empresaId)
    .eq("unidade_id", contexto.unidadeId)
    .is("arquivado_em", null)
    .maybeSingle();
  return {
    data: data as unknown as LinhaFichaVeiculo | null,
    error,
  };
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
  executarConsulta?: ExecutarConsultaVeiculos,
  contexto?: ContextoOperacionalAtivo
): Promise<ListagemVeiculos> {



  const { data, error } = executarConsulta
    ? await executarConsulta()
    : await consultarVeiculos(exigirContexto(contexto));


  if (error) throw error;

  const listagem = criarListagemVeiculos((data ?? []).map(mapearVeiculo));


  return listagem;
}

export async function listarResumoVeiculosPersistidos(
  executarConsulta?: ExecutarConsultaResumoVeiculos,
  contexto?: ContextoOperacionalAtivo
): Promise<ListagemResumidaVeiculos> {


  const { data, error } = executarConsulta
    ? await executarConsulta()
    : await consultarResumoVeiculos(exigirContexto(contexto));

  if (error) throw error;

  const dados = Object.freeze((data ?? []).map(mapearVeiculoListagem));
  const resultado = Object.freeze({ dados, total: dados.length });

  return resultado;
}

export async function listarOportunidadesDisponiveisParaVeiculoPersistidas(
  executarConsulta?: ExecutarConsultaOportunidadesDisponiveis,
  contexto?: ContextoOperacionalAtivo
): Promise<readonly OportunidadeDisponivelParaVeiculo[]> {
  const { data, error } = executarConsulta
    ? await executarConsulta()
    : await consultarOportunidadesDisponiveis(exigirContexto(contexto));
  if (error) throw error;
  return Object.freeze((data ?? []).map(({
    id,
    proprietario_nome,
    veiculo_informado,
    placa,
  }) => Object.freeze({ id, proprietario_nome, veiculo_informado, placa })));
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
  executarObtencao?: ExecutarObtencaoVeiculo,
  contexto?: ContextoOperacionalAtivo
): Promise<Veiculo | null> {



  const { data, error } = executarObtencao
    ? await executarObtencao(id)
    : await consultarVeiculoPorId(id, exigirContexto(contexto));


  if (error) throw error;

  const veiculo = data === null ? null : mapearVeiculo(data);


  return veiculo;
}

export async function obterFichaVeiculoPersistidaPorId(
  id: string,
  executarConsulta?: ExecutarConsultaFichaVeiculo,
  contexto?: ContextoOperacionalAtivo
): Promise<FichaVeiculoPersistida | null> {


  const { data, error } = executarConsulta
    ? await executarConsulta(id)
    : await consultarFichaVeiculoPorId(id, exigirContexto(contexto));

  if (error) throw error;
  if (data === null) return null;

  const oportunidade = data.oportunidade === null
    ? null
    : Object.freeze({
        id: data.oportunidade.id,
        proprietario_nome: data.oportunidade.proprietario_nome,
        veiculo_informado: data.oportunidade.veiculo_informado,
        placa: data.oportunidade.placa,
      });
  const ficha = Object.freeze({
    veiculo: mapearVeiculo(data),
    oportunidade,
  });

  return ficha;
}

type ResultadoPlacaVeiculo = { data: { placa: string } | null; error: unknown };
async function consultarPlacaVeiculoPorId(id: string): Promise<ResultadoPlacaVeiculo> {
  return supabase.from("veiculos").select("placa").eq("id", id).maybeSingle();
}
export async function obterPlacaVeiculoPersistidaPorId(id: string, executar = consultarPlacaVeiculoPorId): Promise<string | null> {


  const { data, error } = await executar(id);

  if (error) throw error;
  return data?.placa ?? null;
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
