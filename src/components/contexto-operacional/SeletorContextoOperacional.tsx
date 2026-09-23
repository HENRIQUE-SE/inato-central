"use client";

import { useState, type FormEvent } from "react";
import type { UnidadeOperacionalPermitida } from "@/core/organizacao";

type SeletorContextoOperacionalProps = {
  readonly unidades: readonly UnidadeOperacionalPermitida[];
  readonly processando: boolean;
  readonly erro: string | null;
  readonly permiteCancelar: boolean;
  readonly aoSelecionar: (unidadeId: string) => void;
  readonly aoCancelar: () => void;
};

export default function SeletorContextoOperacional({
  unidades,
  processando,
  erro,
  permiteCancelar,
  aoSelecionar,
  aoCancelar,
}: SeletorContextoOperacionalProps) {
  const [unidadeId, setUnidadeId] = useState("");

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!processando && unidadeId) aoSelecionar(unidadeId);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
      <form
        onSubmit={enviar}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <p className="text-sm font-medium text-slate-500">INATO Central</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Selecionar Unidade</h1>
        <p className="mt-2 text-sm text-slate-500">
          Escolha explicitamente a Unidade em que deseja operar nesta aba.
        </p>

        <label className="mt-6 block text-sm font-semibold" htmlFor="unidade-operacional">
          Unidade autorizada
        </label>
        <select
          id="unidade-operacional"
          value={unidadeId}
          onChange={(evento) => setUnidadeId(evento.target.value)}
          disabled={processando}
          required
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
        >
          <option value="">Selecione uma Unidade</option>
          {unidades.map((unidade) => (
            <option key={unidade.unidadeId} value={unidade.unidadeId}>
              {unidade.nomeExibicao} — {unidade.cidade}/{unidade.uf}
            </option>
          ))}
        </select>

        {unidades.length === 0 && (
          <p className="mt-3 text-sm text-slate-600">Nenhuma Unidade autorizada foi encontrada.</p>
        )}
        {erro && <p role="alert" className="mt-4 text-sm text-red-700">{erro}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {permiteCancelar && (
            <button
              type="button"
              onClick={aoCancelar}
              disabled={processando}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
            >
              Voltar
            </button>
          )}
          <button
            type="submit"
            disabled={processando || !unidadeId}
            className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ? "Validando..." : "Continuar"}
          </button>
        </div>
      </form>
    </main>
  );
}
