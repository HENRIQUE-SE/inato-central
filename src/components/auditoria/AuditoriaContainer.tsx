"use client";

import { useEffect, useState } from "react";
import { listarAuditoria, type AuditoriaItem } from "@/services/auditoria.service";
import { obterSessaoAtualAutenticada } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import type { AcaoAuditoria, ResultadoAuditoria } from "@/core/auditoria";
import AuditoriaCarregando from "./AuditoriaCarregando";
import AuditoriaErro from "./AuditoriaErro";
import AuditoriaEstadoVazio from "./AuditoriaEstadoVazio";
import AuditoriaFiltros, { type FiltrosAuditoria } from "./AuditoriaFiltros";
import AuditoriaPaginacao from "./AuditoriaPaginacao";
import AuditoriaTabela from "./AuditoriaTabela";

const INICIAIS: FiltrosAuditoria = { termoPesquisa: "", modulo: "", acao: "", resultado: "" };

export default function AuditoriaContainer() {
  const router = useRouter();
  const [dados, setDados] = useState<AuditoriaItem[]>([]);
  const [filtros, setFiltros] = useState(INICIAIS);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(false);
    obterSessaoAtualAutenticada().then((sessao) => {
      if (sessao === null) { router.replace("/login"); return null; }
      return listarAuditoria({
      pagina,
      itensPorPagina: 10,
      termoPesquisa: filtros.termoPesquisa,
      modulo: filtros.modulo || undefined,
      acao: (filtros.acao || undefined) as AcaoAuditoria | undefined,
      resultado: (filtros.resultado || undefined) as ResultadoAuditoria | undefined,
      });
    }).then((resultado) => {
      if (!ativo || resultado === null) return;
      if (pagina > resultado.totalPaginas) {
        setPagina(resultado.totalPaginas);
        return;
      }
      setDados(resultado.dados);
      setTotalPaginas(resultado.totalPaginas);
      setCarregando(false);
    }).catch(() => {
      if (!ativo) return;
      setErro(true);
      setCarregando(false);
    });
    return () => { ativo = false; };
  }, [filtros, pagina, router]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm font-medium text-slate-500">INATO Central</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Auditoria da Plataforma INATO</h1>
        <p className="mt-2 text-sm text-slate-500">Histórico de ações registradas no sistema.</p>
        <AuditoriaFiltros filtros={filtros} onChange={(novos) => { setFiltros(novos); setPagina(1); }} />
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {carregando ? <AuditoriaCarregando /> : erro ? <AuditoriaErro /> : dados.length === 0 ? <AuditoriaEstadoVazio /> : <AuditoriaTabela dados={dados} />}
          {!carregando && !erro && <AuditoriaPaginacao pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />}
        </section>
      </div>
    </main>
  );
}
