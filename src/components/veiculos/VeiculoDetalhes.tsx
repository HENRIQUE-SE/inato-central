"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CODIGOS_PERMISSAO_ACESSO } from "@/core/acesso";
import { ROTULOS_STATUS_VEICULO, STATUS_VEICULO, type Veiculo } from "@/core/veiculos";
import { usuarioAtualPossuiPermissao } from "@/services/acesso.service";
import { obterSessaoAtualAutenticada } from "@/services/auth.service";
import { atualizarVeiculo, marcarVeiculoProntoParaAnunciar, obterOportunidadeOrigemDoVeiculo, obterVeiculoPorId, type DadosFormularioAtualizacaoVeiculo } from "@/services/veiculos.service";
import AcessoNegado from "@/components/auth/AcessoNegado";
import VeiculoFormulario from "./VeiculoFormulario";

export default function VeiculoDetalhes({ id }: { id: string }) {
  const router = useRouter();
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [oportunidade, setOportunidade] = useState("Oportunidade não identificada");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [podeEditar, setPodeEditar] = useState(false);
  const [podeConcluirPreparacao, setPodeConcluirPreparacao] = useState(false);
  const [editando, setEditando] = useState(false);
  const [confirmandoStatus, setConfirmandoStatus] = useState(false);
  const [processandoStatus, setProcessandoStatus] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    const encontrado = await obterVeiculoPorId(id);
    const origem = await obterOportunidadeOrigemDoVeiculo(encontrado.oportunidadeId);
    setVeiculo(encontrado);
    if (origem) setOportunidade(`${origem.proprietario_nome} — ${origem.veiculo_informado} — ${origem.placa}`);
  }, [id]);

  useEffect(() => {
    let ativo = true;
    obterSessaoAtualAutenticada().then(async (sessao) => {
      if (sessao === null) { router.replace("/login"); return; }
      const [visualiza, edita, concluiPreparacao] = await Promise.all([
        usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR),
        usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR),
        usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR),
      ]);
      if (!visualiza) { if (ativo) setAcessoNegado(true); return; }
      if (ativo) setPodeEditar(edita);
      if (ativo) setPodeConcluirPreparacao(concluiPreparacao);
      await carregar();
    }).catch((error) => {
      if (ativo) setErro(error instanceof Error && error.message === "Veículo não encontrado."
        ? error.message : "Não foi possível carregar o veículo.");
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [carregar, router]);

  async function salvar(dados: DadosFormularioAtualizacaoVeiculo) {
    const atualizado = await atualizarVeiculo(id, dados);
    setVeiculo(atualizado);
    setEditando(false);
    setMensagem("Veículo atualizado com sucesso.");
  }

  async function concluirPreparacao() {
    setProcessandoStatus(true);
    setErroAcao("");
    try {
      const atualizado = await marcarVeiculoProntoParaAnunciar(id);
      setVeiculo(atualizado);
      setConfirmandoStatus(false);
      setMensagem("Veículo marcado como pronto para anunciar.");
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Não foi possível atualizar o status do veículo.");
    } finally {
      setProcessandoStatus(false);
    }
  }

  if (acessoNegado) return <AcessoNegado />;
  return <main className="min-h-screen bg-slate-100 text-slate-900"><div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
    <Link href="/veiculos" className="text-sm font-semibold text-slate-600">← Voltar para Veículos</Link>
    {carregando ? <p className="mt-8 rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Carregando veículo...</p>
      : erro ? <p className="mt-8 rounded-2xl bg-white p-10 text-center text-sm text-red-600">{erro}</p>
      : veiculo && <>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">INATO Central</p><h1 className="mt-1 text-3xl font-bold">{veiculo.placa}</h1></div>
          <div className="flex flex-wrap gap-3">
            {podeConcluirPreparacao && veiculo.status === STATUS_VEICULO.EM_PREPARACAO && !editando && !confirmandoStatus && <button type="button" onClick={() => { setConfirmandoStatus(true); setMensagem(""); setErroAcao(""); }} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Marcar como pronto para anunciar</button>}
            {podeEditar && !editando && !confirmandoStatus && <button type="button" onClick={() => { setEditando(true); setMensagem(""); }} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Editar veículo</button>}
          </div>
        </div>
        {mensagem && <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{mensagem}</p>}
        {erroAcao && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroAcao}</p>}
        {confirmandoStatus && <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-950">Confirmar que este veículo está pronto para anunciar?</p>
          <div className="mt-4 flex gap-3">
            <button type="button" disabled={processandoStatus} onClick={concluirPreparacao} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{processandoStatus ? "Processando..." : "Confirmar"}</button>
            <button type="button" disabled={processandoStatus} onClick={() => setConfirmandoStatus(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancelar</button>
          </div>
        </section>}
        {editando ? <VeiculoFormulario dadosIniciais={paraFormulario(veiculo)} oportunidadeOrigem={oportunidade} onCancelar={() => setEditando(false)} onSalvar={salvar} />
          : <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
            <Detalhe rotulo="Placa" valor={veiculo.placa} /><Detalhe rotulo="Marca" valor={veiculo.marca} />
            <Detalhe rotulo="Modelo" valor={veiculo.modelo} /><Detalhe rotulo="Versão" valor={veiculo.versao} />
            <Detalhe rotulo="Ano fabricação/modelo" valor={`${veiculo.anoFabricacao}/${veiculo.anoModelo}`} /><Detalhe rotulo="Cor" valor={veiculo.cor} />
            <Detalhe rotulo="Quilometragem" valor={`${veiculo.quilometragem.toLocaleString("pt-BR")} km`} /><Detalhe rotulo="Proprietário" valor={veiculo.proprietarioNome} />
            <Detalhe rotulo="Status" valor={ROTULOS_STATUS_VEICULO[veiculo.status]} /><Detalhe rotulo="Oportunidade de origem" valor={oportunidade} />
            {veiculo.renavam && <Detalhe rotulo="Renavam" valor={veiculo.renavam} />}{veiculo.chassi && <Detalhe rotulo="Chassi" valor={veiculo.chassi} />}
            {veiculo.codigoFipe && <Detalhe rotulo="Código FIPE" valor={veiculo.codigoFipe} />}
            <Detalhe rotulo="Criado em" valor={formatarData(veiculo.criadoEm)} /><Detalhe rotulo="Atualizado em" valor={formatarData(veiculo.atualizadoEm)} />
          </section>}
      </>}
  </div></main>;
}

function paraFormulario(veiculo: Veiculo): DadosFormularioAtualizacaoVeiculo {
  return { proprietarioNome: veiculo.proprietarioNome, placa: veiculo.placa, marca: veiculo.marca,
    modelo: veiculo.modelo, versao: veiculo.versao ?? "", anoFabricacao: veiculo.anoFabricacao,
    anoModelo: veiculo.anoModelo, cor: veiculo.cor, quilometragem: veiculo.quilometragem,
    renavam: veiculo.renavam ?? "", chassi: veiculo.chassi ?? "", codigoFipe: veiculo.codigoFipe ?? "" };
}
function formatarData(valor: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)); }
function Detalhe({ rotulo, valor }: { rotulo: string; valor: string | null }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{rotulo}</dt><dd className="mt-1 text-sm">{valor || "Não informado"}</dd></div>; }
