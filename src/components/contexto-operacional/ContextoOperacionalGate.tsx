"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { obterUnidadesOperacionaisPermitidasAtuais } from "@/services/acesso.service";
import {
  definirPreferenciaContextoOperacionalAtual,
  obterContextoOperacionalPreferidoAtual,
} from "@/services/contexto-operacional.service";
import SeletorContextoOperacional from "./SeletorContextoOperacional";
import UnidadeAtiva from "./UnidadeAtiva";
import {
  childrenPodemSerMontados,
  deveRecarregarPaginaAposSelecao,
  resolverEstadoContextoOperacional,
  selecionarContextoOperacional,
  type ContextoResolvidoVisual,
  type DependenciasContextoOperacionalVisual,
  type EstadoContextoOperacionalVisual,
} from "./contexto-operacional.logic";

const DEPENDENCIAS: DependenciasContextoOperacionalVisual = {
  obterContexto: obterContextoOperacionalPreferidoAtual,
  definirContexto: definirPreferenciaContextoOperacionalAtual,
  obterUnidades: obterUnidadesOperacionaisPermitidasAtuais,
};

export default function ContextoOperacionalGate({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoContextoOperacionalVisual>({ estado: "carregando" });
  const [processando, setProcessando] = useState(false);
  const envioEmAndamento = useRef(false);

  useEffect(() => {
    let ativo = true;
    resolverEstadoContextoOperacional(DEPENDENCIAS).then((resultado) => {
      if (!ativo) return;
      if (resultado.estado === "nao_autenticado") router.replace("/login");
      setEstado(resultado);
    });
    return () => { ativo = false; };
  }, [router]);

  async function selecionar(unidadeId: string) {
    if (envioEmAndamento.current || estado.estado !== "selecao_necessaria") return;
    envioEmAndamento.current = true;
    setProcessando(true);
    const anterior = estado.contextoAnterior;
    const resultado = await selecionarContextoOperacional(
      unidadeId,
      estado.unidades,
      anterior,
      DEPENDENCIAS
    );
    if (resultado.estado === "nao_autenticado") router.replace("/login");
    if (deveRecarregarPaginaAposSelecao(resultado, anterior)) {
      window.location.reload();
      return;
    }
    envioEmAndamento.current = false;
    setProcessando(false);
    setEstado(resultado);
  }

  function trocarUnidade(contextoAtual: ContextoResolvidoVisual) {
    setEstado({
      estado: "selecao_necessaria",
      unidades: contextoAtual.unidades,
      erro: null,
      contextoAnterior: contextoAtual,
    });
  }

  if (estado.estado === "carregando" || estado.estado === "nao_autenticado") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-sm text-slate-600">
        {estado.estado === "carregando" ? "Carregando contexto operacional..." : "Redirecionando para o login..."}
      </main>
    );
  }

  if (estado.estado === "erro_infraestrutura") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Contexto operacional indisponível</h1>
          <p role="alert" className="mt-3 text-sm text-red-700">{estado.mensagem}</p>
        </div>
      </main>
    );
  }

  if (estado.estado === "selecao_necessaria") {
    return (
      <SeletorContextoOperacional
        unidades={estado.unidades}
        processando={processando}
        erro={estado.erro}
        permiteCancelar={estado.contextoAnterior !== null}
        aoSelecionar={selecionar}
        aoCancelar={() => {
          if (estado.contextoAnterior) setEstado({ estado: "contexto_resolvido", ...estado.contextoAnterior });
        }}
      />
    );
  }

  if (!childrenPodemSerMontados(estado)) return null;
  return (
    <>
      <UnidadeAtiva unidade={estado.unidade} aoTrocar={() => trocarUnidade(estado)} />
      {children}
    </>
  );
}
