"use client";

import { useEffect, useState } from "react";
import { obterContextoAcessoAutenticadoAtual } from "@/services/acesso.service";
import {
  criarIdentidadeUsuarioVisual,
  type IdentidadeUsuarioVisual,
} from "./identidade-usuario.logic";

type EstadoIdentidade =
  | { readonly estado: "carregando" }
  | { readonly estado: "carregado"; readonly identidade: IdentidadeUsuarioVisual }
  | { readonly estado: "indisponivel" };

export default function IdentidadeUsuarioAtual() {
  const [estado, setEstado] = useState<EstadoIdentidade>({ estado: "carregando" });

  useEffect(() => {
    let ativo = true;
    obterContextoAcessoAutenticadoAtual()
      .then((autoridade) => {
        if (!ativo) return;
        const identidade = autoridade === null ? null : criarIdentidadeUsuarioVisual(autoridade);
        setEstado(identidade === null
          ? { estado: "indisponivel" }
          : { estado: "carregado", identidade });
      })
      .catch(() => {
        if (ativo) setEstado({ estado: "indisponivel" });
      });
    return () => { ativo = false; };
  }, []);

  if (estado.estado !== "carregado") {
    return (
      <div className="flex items-center gap-3" aria-live="polite">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-500">
            {estado.estado === "carregando" ? "Carregando identidade..." : "Identidade indisponível"}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
          {estado.estado === "carregando" ? "…" : "?"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold">{estado.identidade.perfil}</p>
        <p className="text-xs text-slate-500">{estado.identidade.identificacao}</p>
      </div>
      <div
        aria-label={`Usuário ${estado.identidade.identificacao}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
      >
        {estado.identidade.inicial}
      </div>
    </div>
  );
}
