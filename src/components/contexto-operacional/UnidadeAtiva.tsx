"use client";

import type { UnidadeOperacionalPermitida } from "@/core/organizacao";

type UnidadeAtivaProps = {
  readonly unidade: UnidadeOperacionalPermitida;
  readonly aoTrocar: () => void;
};

export default function UnidadeAtiva({ unidade, aoTrocar }: UnidadeAtivaProps) {
  return (
    <aside className="border-b border-slate-200 bg-white px-4 py-3 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unidade ativa</p>
          <p className="mt-0.5 text-sm font-semibold">{unidade.nomeExibicao}</p>
          <p className="text-xs text-slate-500">{unidade.cidade}/{unidade.uf}</p>
        </div>
        <button
          type="button"
          onClick={aoTrocar}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Trocar unidade
        </button>
      </div>
    </aside>
  );
}
