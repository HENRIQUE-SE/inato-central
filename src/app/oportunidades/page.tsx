"use client";

import { useState } from "react";

export default function OportunidadesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* CABEÇALHO */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              INATO Central
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Oportunidades
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Gerencie os primeiros contatos de proprietários interessados em
              vender seus veículos através da INATO.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Nova oportunidade
          </button>
        </div>

        {/* FORMULÁRIO */}
        {showForm && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Nova oportunidade
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registre os dados iniciais do proprietário e do veículo.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome do proprietário
                </label>

                <input
                  type="text"
                  placeholder="Ex.: João da Silva"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Telefone
                </label>

                <input
                  type="tel"
                  placeholder="(34) 99999-9999"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cidade
                </label>

                <input
                  type="text"
                  defaultValue="Patrocínio - MG"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Veículo informado
                </label>

                <input
                  type="text"
                  placeholder="Ex.: Chevrolet Onix 1.0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Placa
                </label>

                <input
                  type="text"
                  placeholder="ABC1D23"
                  maxLength={7}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Origem
                </label>

                <select className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900">
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Indicação</option>
                  <option>Site</option>
                  <option>Outro</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Salvar oportunidade
              </button>
            </div>
          </section>
        )}

        {/* FILTROS */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="search"
              placeholder="Pesquisar proprietário, veículo ou placa..."
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 md:col-span-2"
            />

            <select className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option>Todos os status</option>
              <option>Novo</option>
              <option>Em análise</option>
              <option>Aprovado</option>
              <option>Recusado</option>
            </select>
          </div>
        </section>

        {/* LISTAGEM */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold">Oportunidades cadastradas</h2>

            <p className="mt-1 text-sm text-slate-500">
              Nenhuma oportunidade cadastrada ainda.
            </p>
          </div>

          <div className="flex min-h-64 items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                🚗
              </div>

              <h3 className="mt-4 font-semibold">
                Nenhuma oportunidade encontrada
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Quando uma nova oportunidade for cadastrada, ela aparecerá
                nesta área.
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="mt-5 text-sm font-semibold text-slate-900 underline underline-offset-4"
              >
                Cadastrar primeira oportunidade
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}