"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CODIGOS_PERMISSAO_ACESSO } from "@/core/acesso";
import type { Veiculo } from "@/core/veiculos";
import { exigirPermissao, usuarioAtualPossuiPermissao } from "@/services/acesso.service";
import { obterSessaoAtualAutenticada } from "@/services/auth.service";
import {
  criarVeiculo,
  listarOportunidadesDisponiveisParaVeiculo,
  listarVeiculos,
  type DadosFormularioVeiculo,
  type OportunidadeParaVeiculo,
} from "@/services/veiculos.service";
import AcessoNegado from "@/components/auth/AcessoNegado";
import VeiculoFormulario from "./VeiculoFormulario";
import VeiculosEstadoVazio from "./VeiculosEstadoVazio";
import VeiculosTabela from "./VeiculosTabela";

export default function VeiculosContainer() {
  const router = useRouter();
  const [veiculos, setVeiculos] = useState<readonly Veiculo[]>([]);
  const [oportunidades, setOportunidades] = useState<readonly OportunidadeParaVeiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [podeCriar, setPodeCriar] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregarDados = useCallback(async () => {
    const [listagem, opcoes] = await Promise.all([
      listarVeiculos(),
      listarOportunidadesDisponiveisParaVeiculo(),
    ]);
    setVeiculos(listagem.dados);
    setOportunidades(opcoes);
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    obterSessaoAtualAutenticada().then(async (sessao) => {
      if (sessao === null) { router.replace("/login"); return; }
      try {
        await exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR);
      } catch {
        if (ativo) setAcessoNegado(true);
        return;
      }
      const criacaoPermitida = await usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR);
      if (ativo) setPodeCriar(criacaoPermitida);
      await carregarDados();
    }).catch(() => {
      if (ativo) setErro(true);
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [carregarDados, router]);

  async function salvar(dados: DadosFormularioVeiculo) {
    await criarVeiculo(dados);
    await carregarDados();
    setMostrarFormulario(false);
    setMensagem("Veículo cadastrado com sucesso.");
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
          {podeCriar && !acessoNegado && <button type="button" onClick={() => { setMostrarFormulario(true); setMensagem(""); }} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Novo veículo</button>}
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
