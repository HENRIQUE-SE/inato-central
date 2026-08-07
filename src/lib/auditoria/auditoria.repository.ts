import { supabase } from "@/lib/supabase";
import type {
  AcaoAuditoria,
  RegistroAuditoria,
  ResultadoAuditoria,
  ValorAuditoria,
} from "@/core/auditoria";

type LinhaAuditoria = {
  id: string;
  empresa_id: string;
  unidade_id: string | null;
  usuario_id: string;
  modulo: string;
  acao: AcaoAuditoria;
  recurso_tipo: string;
  recurso_id: string | null;
  resultado: ResultadoAuditoria;
  origem: RegistroAuditoria["origem"];
  detalhes: Readonly<Record<string, ValorAuditoria>> | null;
  criado_em: string;
};

export type ListarEventosAuditoriaPersistidosParametros = {
  pagina?: number;
  itensPorPagina?: number;
  termoPesquisa?: string;
  modulo?: string;
  acao?: AcaoAuditoria;
  resultado?: ResultadoAuditoria;
};

export type ListarEventosAuditoriaPersistidosResultado = {
  dados: RegistroAuditoria[];
  total: number;
  pagina: number;
  itensPorPagina: number;
};

function paraLinha(evento: RegistroAuditoria): LinhaAuditoria {
  if (evento.usuarioId === null) {
    throw new Error("Usuário autenticado é obrigatório para persistir auditoria.");
  }
  return {
    id: evento.id,
    empresa_id: evento.empresaId,
    unidade_id: evento.unidadeId,
    usuario_id: evento.usuarioId,
    modulo: evento.modulo,
    acao: evento.acao,
    recurso_tipo: evento.recursoTipo,
    recurso_id: evento.recursoId,
    resultado: evento.resultado,
    origem: evento.origem,
    detalhes: evento.detalhes,
    criado_em: evento.criadoEm,
  };
}

function paraRegistro(linha: LinhaAuditoria): RegistroAuditoria {
  return {
    id: linha.id,
    empresaId: linha.empresa_id,
    unidadeId: linha.unidade_id,
    usuarioId: linha.usuario_id,
    modulo: linha.modulo,
    acao: linha.acao,
    recursoTipo: linha.recurso_tipo,
    recursoId: linha.recurso_id,
    resultado: linha.resultado,
    origem: linha.origem,
    detalhes: linha.detalhes,
    criadoEm: linha.criado_em,
  };
}

export async function persistirEventoAuditoria(
  evento: RegistroAuditoria
): Promise<RegistroAuditoria> {
  const { data, error } = await supabase
    .from("auditoria_eventos")
    .insert(paraLinha(evento))
    .select("*")
    .single();

  if (error) throw error;
  return paraRegistro(data as LinhaAuditoria);
}

export async function listarEventosAuditoriaPersistidos({
  pagina = 1,
  itensPorPagina = 10,
  termoPesquisa = "",
  modulo,
  acao,
  resultado,
}: ListarEventosAuditoriaPersistidosParametros = {}): Promise<ListarEventosAuditoriaPersistidosResultado> {
  const paginaValida = Math.max(1, pagina);
  const inicio = (paginaValida - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina - 1;
  let consulta = supabase
    .from("auditoria_eventos")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(inicio, fim);

  if (termoPesquisa.trim()) consulta = consulta.ilike("detalhes->>placa", `%${termoPesquisa.trim()}%`);
  if (modulo) consulta = consulta.eq("modulo", modulo);
  if (acao) consulta = consulta.eq("acao", acao);
  if (resultado) consulta = consulta.eq("resultado", resultado);

  const { data, error, count } = await consulta;
  if (error) throw error;

  return {
    dados: ((data ?? []) as LinhaAuditoria[]).map(paraRegistro),
    total: count ?? 0,
    pagina: paginaValida,
    itensPorPagina,
  };
}

export async function obterEventoAuditoriaPersistidoPorId(
  id: string
): Promise<RegistroAuditoria | null> {
  const { data, error } = await supabase
    .from("auditoria_eventos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data === null ? null : paraRegistro(data as LinhaAuditoria);
}
