"use client";

import { useEffect, useState } from "react";
import type { Veiculo } from "@/core/veiculos";
import { listarVeiculos } from "@/services/veiculos.service";
import VeiculosEstadoVazio from "./VeiculosEstadoVazio";

export default function VeiculosContainer() {
  const [veiculos, setVeiculos] = useState<readonly Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarVeiculos()
      .then((resultado) => {
        if (ativo) setVeiculos(resultado.dados);
      })
      .catch(() => {
        if (ativo) setErro(true);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm font-medium text-slate-500">INATO Central</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
            <p className="mt-2 text-sm text-slate-500">
              Gestão dos veículos da operação.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Novo veículo
          </button>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {carregando ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando veículos...</div>
          ) : erro ? (
            <div className="p-10 text-center text-sm text-red-600">Não foi possível carregar os veículos.</div>
          ) : veiculos.length === 0 ? (
            <VeiculosEstadoVazio />
          ) : (
            <div className="p-6 text-sm text-slate-600">
              {veiculos.length} veículo(s) cadastrado(s).
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
