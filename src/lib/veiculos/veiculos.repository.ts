import { criarListagemVeiculos, type ListagemVeiculos, type Veiculo } from "@/core/veiculos";
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

export async function listarVeiculosPersistidos(
  executarConsulta: ExecutarConsultaVeiculos = consultarVeiculos
): Promise<ListagemVeiculos> {
  const { data, error } = await executarConsulta();
  if (error) throw error;
  return criarListagemVeiculos((data ?? []).map(mapearVeiculo));
}
