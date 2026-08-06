"use client";

import { useEffect, useState } from "react";
import {
  atualizarOportunidade,
  criarOportunidade,
  excluirOportunidade,
  listarOportunidades,
} from "@/services/oportunidades.service";
import type { Oportunidade } from "@/types/oportunidade";
import CardOportunidade from "@/components/oportunidades/CardOportunidade";
import FormOportunidade from "@/components/oportunidades/FormOportunidade";
export default function OportunidadesContainer() {
  const [showForm, setShowForm] = useState(false);

  const [proprietarioNome, setProprietarioNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("Patrocínio - MG");
  const [veiculoInformado, setVeiculoInformado] = useState("");
  const [placa, setPlaca] = useState("");
  const [origem, setOrigem] = useState("Instagram");
  const [salvando, setSalvando] = useState(false);
const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
const [oportunidadeEmEdicao, setOportunidadeEmEdicao] =
  useState<Oportunidade | null>(null);
async function carregarOportunidades() {
  try {
    const { dados } = await listarOportunidades({ itensPorPagina: 1000 });
    setOportunidades(dados);
  } catch {
    alert("Não foi possível carregar as oportunidades.");
  }
}
function iniciarEdicao(oportunidade: Oportunidade) {
  setOportunidadeEmEdicao(oportunidade);

  setProprietarioNome(oportunidade.proprietario_nome);
  setTelefone(oportunidade.telefone);
  setCidade(oportunidade.cidade);
  setVeiculoInformado(oportunidade.veiculo_informado);
  setPlaca(oportunidade.placa);
  setOrigem(oportunidade.origem);

  setShowForm(true);
}
async function excluirOportunidadeSelecionada(id: string) {
  const confirmar = confirm(
    "Tem certeza que deseja excluir esta oportunidade?"
  );

  if (!confirmar) {
    return;
  }

  try {
    await excluirOportunidade(id);
  } catch {
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

    const dadosOportunidade = {
  proprietario_nome: proprietarioNome,
  telefone,
  cidade,
  veiculo_informado: veiculoInformado,
  placa,
  origem,
  status: oportunidadeEmEdicao?.status ?? "novo",
};

try {
  if (oportunidadeEmEdicao) {
    await atualizarOportunidade(
      oportunidadeEmEdicao.id,
      dadosOportunidade
    );
  } else {
    await criarOportunidade(dadosOportunidade);
  }
} catch (error) {
  setSalvando(false);
  alert(JSON.stringify(error, null, 2));
  return;
}

    setSalvando(false);

    alert("Oportunidade salva com sucesso!");

    setProprietarioNome("");
    setTelefone("");
    setCidade("Patrocínio - MG");
    setVeiculoInformado("");
    setPlaca("");
    setOrigem("Instagram");

setOportunidadeEmEdicao(null);
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
  <FormOportunidade
    proprietarioNome={proprietarioNome}
    telefone={telefone}
    cidade={cidade}
    veiculoInformado={veiculoInformado}
    placa={placa}
    origem={origem}
    salvando={salvando}
    onProprietarioNomeChange={setProprietarioNome}
    onTelefoneChange={setTelefone}
    onCidadeChange={setCidade}
    onVeiculoInformadoChange={setVeiculoInformado}
    onPlacaChange={setPlaca}
    onOrigemChange={setOrigem}
    onCancelar={() => {
  setOportunidadeEmEdicao(null);
  setShowForm(false);
}}
    onSalvar={salvarOportunidade}
  />
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
  <CardOportunidade
  key={oportunidade.id}
  oportunidade={oportunidade}
  onEditar={iniciarEdicao}
  onExcluir={excluirOportunidadeSelecionada}
/>
))}
  </div>
)}

             
        </section>
      </div>
    </main>
  );
}
