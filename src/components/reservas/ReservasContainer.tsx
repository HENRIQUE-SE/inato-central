"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CODIGOS_PERMISSAO_ACESSO } from "@/core/acesso";
import { MOTIVOS_CANCELAMENTO_RESERVA, ROTULOS_MOTIVO_CANCELAMENTO_RESERVA, normalizarCancelamentoReserva, validarMotivoCancelamentoReserva } from "@/core/reservas";
import type { Reserva } from "@/core/reservas";
import type { Negociacao } from "@/core/negociacoes";
import type { Veiculo } from "@/core/veiculos";
import AcessoNegado from "@/components/auth/AcessoNegado";
import { usuarioAtualPossuiPermissao } from "@/services/acesso.service";
import { obterSessaoAtualAutenticada } from "@/services/auth.service";
import { listarNegociacoes, listarVeiculosParaConsultaDeNegociacoes } from "@/services/negociacoes.service";
import { cancelarReserva, listarReservas } from "@/services/reservas.service";
import ReservasTabela from "./ReservasTabela";

export default function ReservasContainer() {
  const router = useRouter();
  const [dados, setDados] = useState<readonly Reserva[]>([]);
  const [negociacoes, setNegociacoes] = useState<readonly Negociacao[]>([]);
  const [veiculos, setVeiculos] = useState<readonly Veiculo[]>([]);
  const [podeCancelar, setPodeCancelar] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [processando, setProcessando] = useState(false);
  const [negado, setNegado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const [reservas, listaNegociacoes, listaVeiculos] = await Promise.all([
      listarReservas(),
      listarNegociacoes({ itensPorPagina: 1000 }),
      listarVeiculosParaConsultaDeNegociacoes(),
    ]);
    setDados(reservas.dados);
    setNegociacoes(listaNegociacoes.dados);
    setVeiculos(listaVeiculos);
  }, []);

  useEffect(() => {
    obterSessaoAtualAutenticada()
      .then(async (sessao) => {
        if (!sessao) {
          router.replace("/login");
          return;
        }
        const [visualizar, cancelar] = await Promise.all([
          usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.RESERVAS_VISUALIZAR),
          usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.RESERVAS_CANCELAR),
        ]);
        if (!visualizar) {
          setNegado(true);
          return;
        }
        setPodeCancelar(cancelar);
        await carregar();
      })
      .catch((erroAtual) => setErro(erroAtual instanceof Error ? erroAtual.message : "Não foi possível concluir a operação."))
      .finally(() => setCarregando(false));
  }, [carregar, router]);

  async function confirmarCancelamento() {
    if (!reservaParaCancelar) return;
    setProcessando(true);
    setErro("");
    try {
      await cancelarReserva(reservaParaCancelar, motivo, detalhes);
      setReservaParaCancelar(null);
      await carregar();
    } catch (erroAtual) {
      setErro(erroAtual instanceof Error ? erroAtual.message : "Não foi possível cancelar a reserva.");
    } finally {
      setProcessando(false);
    }
  }

  if (negado) return <AcessoNegado />;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-slate-500">INATO Central</p>
        <h1 className="text-3xl font-bold">Reservas</h1>
        <p className="mt-2 text-sm text-slate-500">Comprometimentos temporários de veículos por 24 horas.</p>
        {erro && <p className="mt-5 bg-red-50 p-3 text-red-700">{erro}</p>}
        {reservaParaCancelar && (
          <section className="mt-5">
            <p className="font-medium text-slate-900">Confirmar cancelamento da reserva?</p>
            <label className="mt-3 block text-sm font-semibold">Motivo do cancelamento *</label>
            <select value={motivo} onChange={(e)=>setMotivo(e.target.value)} className="mt-1 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Selecione um motivo</option>{Object.values(MOTIVOS_CANCELAMENTO_RESERVA).map((m)=><option key={m} value={m}>{ROTULOS_MOTIVO_CANCELAMENTO_RESERVA[m]}</option>)}</select>
            {motivo===MOTIVOS_CANCELAMENTO_RESERVA.OUTRO&&<><label className="mt-3 block text-sm font-semibold">Descrição do motivo *</label><textarea maxLength={500} value={detalhes} onChange={(e)=>setDetalhes(e.target.value)} className="mt-1 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2"/></>}
            <div className="mt-3 flex flex-wrap gap-3">
              <button disabled={processando||!validarMotivoCancelamentoReserva(normalizarCancelamentoReserva(motivo,detalhes).motivo,normalizarCancelamentoReserva(motivo,detalhes).detalhes).valido} onClick={confirmarCancelamento} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmar</button>
              <button disabled={processando} onClick={() => {setReservaParaCancelar(null);setMotivo("");setDetalhes("");}} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50">Cancelar</button>
            </div>
          </section>
        )}
        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          {carregando ? <p className="p-10 text-center">Carregando reservas...</p> : dados.length === 0 ? <p className="p-10 text-center text-slate-500">Ainda não existem reservas.</p> : <ReservasTabela reservas={dados} negociacoes={negociacoes} veiculos={veiculos} podeCancelar={podeCancelar} onCancelar={setReservaParaCancelar} />}
        </section>
      </div>
    </main>
  );
}
