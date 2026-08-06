import { supabase } from "@/lib/supabase";
import type {
  DadosOportunidade,
  Oportunidade,
} from "@/types/oportunidade";

export type ListarOportunidadesParametros = {
  pagina?: number;
  itensPorPagina?: number;
  termoPesquisa?: string;
  status?: string;
};

export type ListarOportunidadesResultado = {
  dados: Oportunidade[];
  total: number;
  pagina: number;
  itensPorPagina: number;
};

export async function listarOportunidades({
  pagina = 1,
  itensPorPagina = 10,
  termoPesquisa = "",
  status = "todos",
}: ListarOportunidadesParametros = {}): Promise<ListarOportunidadesResultado> {
  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina - 1;
  const termo = termoPesquisa.trim();

  let consulta = supabase
    .from("oportunidades")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(inicio, fim);

  if (termo) {
    consulta = consulta.or(
      `proprietario_nome.ilike.%${termo}%,veiculo_informado.ilike.%${termo}%,placa.ilike.%${termo}%`
    );
  }

  if (status !== "todos") {
    consulta = consulta.eq("status", status);
  }

  const { data, error, count } = await consulta;

  if (error) {
    throw new Error(error.message);
  }

  return {
    dados: (data ?? []) as Oportunidade[],
    total: count ?? 0,
    pagina,
    itensPorPagina,
  };
}

export async function criarOportunidade(
  dados: DadosOportunidade
): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from("oportunidades")
    .insert([dados])
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Oportunidade;
}

export async function atualizarOportunidade(
  id: string,
  dados: DadosOportunidade
): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from("oportunidades")
    .update(dados)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Oportunidade;
}

export async function excluirOportunidade(id: string): Promise<void> {
  const { error } = await supabase
    .from("oportunidades")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
