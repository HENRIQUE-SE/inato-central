"use client";

import { useState } from "react";
import Link from "next/link";

const menuItems = [
  { name: "Dashboard", icon: "⌂" },
  { name: "Oportunidades", icon: "＋" },
  { name: "Veículos", icon: "🚗" },
  { name: "Negociações", icon: "⇄" },
  { name: "Contratos", icon: "▣" },
  { name: "Financeiro", icon: "R$" },
  { name: "Histórico Comprovado", icon: "✓" },
  { name: "Configurações", icon: "⚙" },
];

const indicators = [
  {
    title: "Comissão a receber",
    value: "R$ 0,00",
    description: "Valores a receber",
  },
  {
    title: "Comissão a pagar",
    value: "R$ 0,00",
    description: "Valores a pagar",
  },
  {
    title: "Carros no estoque",
    value: "0",
    description: "Veículos disponíveis",
  },
  {
    title: "Negociações em andamento",
    value: "0",
    description: "Negociações ativas",
  },
  {
    title: "Contratos vencendo na semana",
    value: "0",
    description: "Contratos próximos do vencimento",
  },
];

export default function Home() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* MENU LATERAL */}
        <aside className="hidden w-72 flex-col bg-slate-950 text-white lg:flex">
          <div className="border-b border-white/10 px-7 py-6">
            <div className="text-2xl font-bold tracking-wide">INATO</div>
            <div className="text-sm font-medium tracking-[0.25em] text-slate-400">
              CENTRAL
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menu principal
            </p>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeMenu === item.name;

                return (
                 <Link
  key={item.name}
  href={item.name === "Oportunidades" ? "/oportunidades" : "#"}
  onClick={() => setActiveMenu(item.name)}
  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
    isActive
      ? "bg-white text-slate-950"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`}
>
  <span className="flex w-7 justify-center text-sm">
    {item.icon}
  </span>
  <span>{item.name}</span>
</Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 px-7 py-5">
            <p className="text-xs text-slate-500">Sistema</p>
            <p className="mt-1 text-sm font-medium text-slate-300">
              INATO Central
            </p>
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* CABEÇALHO */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-500">
                INATO Central
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {activeMenu}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Perfil TESTE</p>
                <p className="text-xs text-slate-500">Usuário de treinamento</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                T
              </div>
            </div>
          </header>

          {/* CONTEÚDO */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-slate-500">
                  Visão geral
                </p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  Dashboard
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Acompanhe os principais números da operação da INATO
                  Veículos.
                </p>
              </div>

              {/* INDICADORES */}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                {indicators.map((indicator) => (
                  <div
                    key={indicator.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm font-medium leading-5 text-slate-500">
                      {indicator.title}
                    </p>

                    <p className="mt-5 text-2xl font-bold tracking-tight">
                      {indicator.value}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {indicator.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* ÁREA DE ATIVIDADE */}
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Atividade recente</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        As movimentações da INATO aparecerão aqui.
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      Em breve
                    </span>
                  </div>

                  <div className="mt-8 flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300">
                    <p className="text-sm text-slate-400">
                      Nenhuma atividade registrada.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold">Acesso rápido</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Principais ações da operação.
                  </p>

                  <div className="mt-6 space-y-3">
                    <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-50">
                      + Nova oportunidade
                    </button>

                    <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-50">
                      + Cadastrar veículo
                    </button>

                    <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-50">
                      Ver negociações
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}