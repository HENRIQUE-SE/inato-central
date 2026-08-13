import { ACOES_AUDITORIA, ORIGENS_AUDITORIA, RESULTADOS_AUDITORIA, registrarEventoAuditoria, type RegistroAuditoria } from "@/core/auditoria";
import type { ContextoAcesso } from "@/core/acesso";
import type { Negociacao } from "@/core/negociacoes";
import type { Veiculo } from "@/core/veiculos";
import { obterContextoAcessoAtual } from "./acesso.service";
import { obterUsuarioAtualAutenticado, type UsuarioAutenticado } from "./auth.service";

export type DependenciasAuditoriaNegociacoes = { obterUsuario: () => Promise<UsuarioAutenticado | null>; obterContexto: () => Promise<ContextoAcesso | null>; persistir: (evento: RegistroAuditoria) => Promise<RegistroAuditoria> };
async function persistir(evento: RegistroAuditoria) { const { persistirEventoAuditoria } = await import("@/lib/auditoria/auditoria.repository"); return persistirEventoAuditoria(evento); }
const PADRAO = { obterUsuario: obterUsuarioAtualAutenticado, obterContexto: obterContextoAcessoAtual, persistir };
async function registrar(negociacao: Negociacao, veiculo: Veiculo, detalhes: Record<string, string | readonly string[]>, deps: DependenciasAuditoriaNegociacoes): Promise<void> {
  try { const [usuario, contexto] = await Promise.all([deps.obterUsuario(), deps.obterContexto()]); if (!usuario || !contexto) throw new Error(); await deps.persistir(registrarEventoAuditoria({ empresaId: contexto.vinculo.empresaId, unidadeId: contexto.vinculo.unidadeId, usuarioId: usuario.id, modulo: "negociacoes", acao: detalhes.camposAlterados ? ACOES_AUDITORIA.ALTERAR : negociacao.status === "em_andamento" ? ACOES_AUDITORIA.CRIAR : ACOES_AUDITORIA.ALTERAR, recursoTipo: "negociacao", recursoId: negociacao.id, resultado: RESULTADOS_AUDITORIA.SUCESSO, origem: ORIGENS_AUDITORIA.USUARIO, detalhes: { veiculoId: negociacao.veiculoId, placa: veiculo.placa, interessado: negociacao.interessadoNome, ...detalhes, perfilCodigo: contexto.perfil.codigo, usuarioEmail: usuario.email } })); } catch { throw new Error("Não foi possível registrar a auditoria da negociação."); }
}
export function registrarAuditoriaCriacaoNegociacao(n: Negociacao, v: Veiculo, d: DependenciasAuditoriaNegociacoes = PADRAO) { return registrar(n, v, { status: n.status }, d); }
export function registrarAuditoriaAlteracaoNegociacao(n: Negociacao, v: Veiculo, campos: readonly string[], d: DependenciasAuditoriaNegociacoes = PADRAO) { return registrar(n, v, { status: n.status, camposAlterados: [...campos] }, d); }
export function registrarAuditoriaEncerramentoNegociacao(anterior: Negociacao, atual: Negociacao, v: Veiculo, d: DependenciasAuditoriaNegociacoes = PADRAO) { return registrar(atual, v, { statusAnterior: anterior.status, statusNovo: atual.status }, d); }
