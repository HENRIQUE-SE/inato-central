"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VeiculoListagem } from "@/core/veiculos";
import {
  criarCarregadorListagemVeiculos,
  criarVeiculo,
  listarOportunidadesDisponiveisParaVeiculo,
  type DadosFormularioVeiculo,
  type OportunidadeParaVeiculo,
} from "@/services/veiculos.service";
import AcessoNegado from "@/components/auth/AcessoNegado";
import VeiculoFormulario from "./VeiculoFormulario";
import VeiculosEstadoVazio from "./VeiculosEstadoVazio";
import VeiculosTabela from "./VeiculosTabela";

export default function VeiculosContainer() {
  const router = useRouter();
  const [veiculos, setVeiculos] = useState<readonly VeiculoListagem[]>([]);
  const [oportunidades, setOportunidades] = useState<readonly OportunidadeParaVeiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [podeCriar, setPodeCriar] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const carregadorRef = useRef<ReturnType<typeof criarCarregadorListagemVeiculos> | null>(null);
  const carregarListagem = carregadorRef.current ??= criarCarregadorListagemVeiculos();

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    carregarListagem().then((resultado) => {
      if (!ativo) return;
      if (resultado.estado === "nao_autenticado") { router.replace("/login"); return; }
      if (resultado.estado === "acesso_negado") { setAcessoNegado(true); return; }
      setVeiculos(resultado.veiculos);
      setPodeCriar(resultado.permissoes.criar);
    }).catch(() => {
      if (ativo) setErro(true);
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [carregarListagem, router]);

  async function salvar(dados: DadosFormularioVeiculo) {
    const criado = await criarVeiculo(dados);
    setVeiculos((atuais) => [criado, ...atuais]);
    setOportunidades((atuais) => atuais.filter(({ id }) => id !== criado.oportunidadeId));
    setMostrarFormulario(false);
    setMensagem("Veículo cadastrado com sucesso.");
  }

  async function abrirFormulario() {
    setMensagem("");
    setErro(false);
    try {
      setOportunidades(await listarOportunidadesDisponiveisParaVeiculo());
      setMostrarFormulario(true);
    } catch {
      setErro(true);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm font-medium text-slate-500">INATO Central</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
            <p className="mt-2 text-sm text-slate-500">Gestão dos veículos da operação.</p>
          </div>
          {podeCriar && !acessoNegado && <button type="button" onClick={abrirFormulario} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Novo veículo</button>}
        </div>

        {mensagem && <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{mensagem}</p>}
        {mostrarFormulario && <VeiculoFormulario oportunidades={oportunidades} onCancelar={() => setMostrarFormulario(false)} onSalvar={salvar} />}

        {acessoNegado ? <AcessoNegado /> : <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {carregando ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando veículos...</div>
          ) : erro ? (
            <div className="p-10 text-center text-sm text-red-600">Não foi possível carregar os veículos.</div>
          ) : veiculos.length === 0 ? (
            <VeiculosEstadoVazio />
          ) : (
            <VeiculosTabela veiculos={veiculos} />
          )}
        </section>}
      </div>
    </main>
  );
}
