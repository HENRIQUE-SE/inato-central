"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
type Oportunidade = {
  id: string;
  proprietario_nome: string;
  telefone: string;
  cidade: string;
  veiculo_informado: string;
  placa: string;
  origem: string;
  status: string;
  created_at: string;
};
export default function OportunidadesPage() {
  const [showForm, setShowForm] = useState(false);

  const [proprietarioNome, setProprietarioNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("Patrocínio - MG");
  const [veiculoInformado, setVeiculoInformado] = useState("");
  const [placa, setPlaca] = useState("");
  const [origem, setOrigem] = useState("Instagram");
  const [salvando, setSalvando] = useState(false);
const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
async function carregarOportunidades() {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Não foi possível carregar as oportunidades.");
    return;
  }

  setOportunidades(data ?? []);
}
async function excluirOportunidade(id: string) {
  const confirmar = confirm(
    "Tem certeza que deseja excluir esta oportunidade?"
  );

  if (!confirmar) {
    return;
  }

  const { error } = await supabase
    .from("oportunidades")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Não foi possível excluir a oportunidade.");
    return;
  }

  alert("Oportunidade excluída com sucesso.");

  carregarOportunidades();
}
useEffect(() => {
  carregarOportunidades();
}, []);

  async function salvarOportunidade() {
    if (
      !proprietarioNome ||
      !telefone ||
      !cidade ||
      !veiculoInformado ||
      !placa
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("oportunidades").insert([
      {
        proprietario_nome: proprietarioNome,
        telefone: telefone,
        cidade: cidade,
        veiculo_informado: veiculoInformado,
        placa: placa,
        origem: origem,
        status: "novo",
      },
    ]);

    setSalvando(false);

    if (error) {
  alert(JSON.stringify(error, null, 2));
  return;
}

    alert("Oportunidade salva com sucesso!");

    setProprietarioNome("");
    setTelefone("");
    setCidade("Patrocínio - MG");
    setVeiculoInformado("");
    setPlaca("");
    setOrigem("Instagram");

    setShowForm(false);
  }

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

              {/* PROPRIETÁRIO */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome do proprietário
                </label>

                <input
                  type="text"
                  placeholder="Ex.: João da Silva"
                  value={proprietarioNome}
                  onChange={(e) => setProprietarioNome(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              {/* TELEFONE */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Telefone
                </label>

                <input
                  type="tel"
                  placeholder="(34) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              {/* CIDADE */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cidade
                </label>

                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              {/* VEÍCULO */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Veículo informado
                </label>

                <input
                  type="text"
                  placeholder="Ex.: Chevrolet Onix 1.0"
                  value={veiculoInformado}
                  onChange={(e) => setVeiculoInformado(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              {/* PLACA */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Placa
                </label>

                <input
                  type="text"
                  placeholder="ABC1D23"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-900"
                />
              </div>

              {/* ORIGEM */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Origem
                </label>

                <select
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                >
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Indicação</option>
                  <option>Site</option>
                  <option>Outro</option>
                </select>
              </div>
            </div>

            {/* BOTÕES */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setShowForm(false)}
                disabled={salvando}
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={salvarOportunidade}
                disabled={salvando}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar oportunidade"}
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

            <h2 className="font-semibold">
              Oportunidades cadastradas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
            {oportunidades.length === 0
  ? "Nenhuma oportunidade cadastrada ainda."
  : `${oportunidades.length} oportunidade(s) cadastrada(s).`}
            </p>

          </div>

          {oportunidades.length === 0 ? (
  <div className="flex min-h-64 items-center justify-center p-8">
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
        🚗
      </div>

      <h3 className="mt-4 font-semibold">
        Nenhuma oportunidade encontrada
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-500">
        Quando uma nova oportunidade for cadastrada, ela aparecerá nesta área.
      </p>

      <button
        onClick={() => setShowForm(true)}
        className="mt-5 text-sm font-semibold text-slate-900 underline underline-offset-4"
      >
        Cadastrar primeira oportunidade
      </button>
    </div>
  </div>
) : (
  <div className="divide-y divide-slate-200">
    {oportunidades.map((oportunidade) => (
      <div
        key={oportunidade.id}
        className="flex items-center justify-between p-5 hover:bg-slate-50"
      >
        <div>
  <h3 className="font-semibold">
    {oportunidade.proprietario_nome}
  </h3>

  <p className="text-sm text-slate-500">
    {oportunidade.veiculo_informado}
  </p>

  <p className="mt-1 text-xs font-medium text-slate-400">
    Placa: {oportunidade.placa}
  </p>
</div>

        <div className="text-right">
  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
    {oportunidade.status}
  </span>

  <p className="mt-2 text-sm font-medium">
    {oportunidade.cidade}
  </p>

  <p className="text-xs text-slate-500">
    {oportunidade.origem}
  </p>
  <div className="mt-3 flex justify-end gap-2">
  <button className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100">
    👁 Ver
  </button>

  <button className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
    ✏ Editar
  </button>

  <button
  onClick={() => excluirOportunidade(oportunidade.id)}
  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
>
  🗑 Excluir
</button>
</div>
</div>
      </div>
    ))}
  </div>
)}

             
        </section>
      </div>
    </main>
  );
}