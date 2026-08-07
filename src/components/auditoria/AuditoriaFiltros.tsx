import { ACOES_AUDITORIA, RESULTADOS_AUDITORIA } from "@/core/auditoria";

export type FiltrosAuditoria = { termoPesquisa: string; modulo: string; acao: string; resultado: string };
type Props = { filtros: FiltrosAuditoria; onChange: (filtros: FiltrosAuditoria) => void };

export default function AuditoriaFiltros({ filtros, onChange }: Props) {
  const alterar = (campo: keyof FiltrosAuditoria, valor: string) => onChange({ ...filtros, [campo]: valor });
  return (
    <section className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <input aria-label="Pesquisar auditoria" type="search" placeholder="Pesquisar por placa..." value={filtros.termoPesquisa} onChange={(e) => alterar("termoPesquisa", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <select aria-label="Filtrar módulo" value={filtros.modulo} onChange={(e) => alterar("modulo", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Todos os módulos</option><option value="oportunidades">Oportunidades</option></select>
      <select aria-label="Filtrar ação" value={filtros.acao} onChange={(e) => alterar("acao", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Todas as ações</option>{Object.values(ACOES_AUDITORIA).map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select>
      <select aria-label="Filtrar resultado" value={filtros.resultado} onChange={(e) => alterar("resultado", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Todos os resultados</option>{Object.values(RESULTADOS_AUDITORIA).map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select>
    </section>
  );
}
