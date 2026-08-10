"use client";

import { useState } from "react";
import type {
  DadosFormularioAtualizacaoVeiculo,
  DadosFormularioVeiculo,
  OportunidadeParaVeiculo,
} from "@/services/veiculos.service";

type PropsCriacao = {
  oportunidades: readonly OportunidadeParaVeiculo[];
  dadosIniciais?: never;
  oportunidadeOrigem?: never;
  onCancelar: () => void;
  onSalvar: (dados: DadosFormularioVeiculo) => Promise<void>;
};

type PropsEdicao = {
  oportunidades?: never;
  dadosIniciais: DadosFormularioAtualizacaoVeiculo;
  oportunidadeOrigem: string;
  onCancelar: () => void;
  onSalvar: (dados: DadosFormularioAtualizacaoVeiculo) => Promise<void>;
};

type Props = PropsCriacao | PropsEdicao;

const INICIAL = {
  oportunidadeId: "", proprietarioNome: "", placa: "", marca: "", modelo: "",
  versao: "", anoFabricacao: "", anoModelo: "", cor: "", quilometragem: "",
  renavam: "", chassi: "", codigoFipe: "",
};

export default function VeiculoFormulario(props: Props) {
  const edicao = props.dadosIniciais !== undefined;
  const [dados, setDados] = useState(() => edicao ? {
    oportunidadeId: "",
    proprietarioNome: props.dadosIniciais.proprietarioNome,
    placa: props.dadosIniciais.placa,
    marca: props.dadosIniciais.marca,
    modelo: props.dadosIniciais.modelo,
    versao: props.dadosIniciais.versao,
    anoFabricacao: String(props.dadosIniciais.anoFabricacao),
    anoModelo: String(props.dadosIniciais.anoModelo),
    cor: props.dadosIniciais.cor,
    quilometragem: String(props.dadosIniciais.quilometragem),
    renavam: props.dadosIniciais.renavam,
    chassi: props.dadosIniciais.chassi,
    codigoFipe: props.dadosIniciais.codigoFipe,
  } : INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alterar(campo: keyof typeof INICIAL, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarOportunidade(id: string) {
    const oportunidade = props.oportunidades?.find((item) => item.id === id);
    setDados((atual) => ({
      ...atual,
      oportunidadeId: id,
      proprietarioNome: oportunidade?.proprietario_nome ?? "",
      placa: oportunidade?.placa ?? "",
    }));
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      const campos: DadosFormularioAtualizacaoVeiculo = {
        proprietarioNome: dados.proprietarioNome,
        placa: dados.placa,
        marca: dados.marca,
        modelo: dados.modelo,
        versao: dados.versao,
        anoFabricacao: dados.anoFabricacao === "" ? Number.NaN : Number(dados.anoFabricacao),
        anoModelo: dados.anoModelo === "" ? Number.NaN : Number(dados.anoModelo),
        cor: dados.cor,
        quilometragem: dados.quilometragem === "" ? Number.NaN : Number(dados.quilometragem),
        renavam: dados.renavam,
        chassi: dados.chassi,
        codigoFipe: dados.codigoFipe,
      };
      if (edicao) await props.onSalvar(campos);
      else await props.onSalvar({ oportunidadeId: dados.oportunidadeId, ...campos });
    } catch (error) {
      setErro(error instanceof Error ? error.message : edicao
        ? "Não foi possível atualizar o veículo."
        : "Não foi possível cadastrar o veículo.");
      setSalvando(false);
    }
  }

  const campo = "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900";
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{edicao ? "Editar veículo" : "Novo veículo"}</h2>
      <p className="mt-1 text-sm text-slate-500">{edicao ? "Atualize os dados permitidos do veículo." : "Vincule uma oportunidade e complete os dados automotivos."}</p>
      {erro && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {edicao ? <div className="md:col-span-2 text-sm font-medium">Oportunidade de origem
          <p className="mt-2 rounded-lg bg-slate-50 px-4 py-3 font-normal text-slate-700">{props.oportunidadeOrigem}</p>
        </div> : <label className="md:col-span-2 text-sm font-medium">Oportunidade de origem *
          <select value={dados.oportunidadeId} onChange={(e) => selecionarOportunidade(e.target.value)} className={`mt-2 ${campo}`}>
            <option value="">Selecione uma oportunidade</option>
            {props.oportunidades.map((o) => <option key={o.id} value={o.id}>{o.proprietario_nome} — {o.veiculo_informado} — {o.placa}</option>)}
          </select>
        </label>}
        <Campo rotulo="Proprietário *" valor={dados.proprietarioNome} onChange={(v) => alterar("proprietarioNome", v)} />
        <Campo rotulo="Placa *" valor={dados.placa} onChange={(v) => alterar("placa", v)} />
        <Campo rotulo="Marca *" valor={dados.marca} onChange={(v) => alterar("marca", v)} />
        <Campo rotulo="Modelo *" valor={dados.modelo} onChange={(v) => alterar("modelo", v)} />
        <Campo rotulo="Versão" valor={dados.versao} onChange={(v) => alterar("versao", v)} />
        <Campo rotulo="Ano de fabricação *" tipo="number" valor={dados.anoFabricacao} onChange={(v) => alterar("anoFabricacao", v)} />
        <Campo rotulo="Ano/modelo *" tipo="number" valor={dados.anoModelo} onChange={(v) => alterar("anoModelo", v)} />
        <Campo rotulo="Cor *" valor={dados.cor} onChange={(v) => alterar("cor", v)} />
        <Campo rotulo="Quilometragem *" tipo="number" valor={dados.quilometragem} onChange={(v) => alterar("quilometragem", v)} />
        <Campo rotulo="Renavam" valor={dados.renavam} onChange={(v) => alterar("renavam", v)} />
        <Campo rotulo="Chassi" valor={dados.chassi} onChange={(v) => alterar("chassi", v)} />
        <Campo rotulo="Código FIPE" valor={dados.codigoFipe} onChange={(v) => alterar("codigoFipe", v)} />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" disabled={salvando} onClick={props.onCancelar} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold disabled:opacity-50">Cancelar</button>
        <button type="button" disabled={salvando} onClick={salvar} className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{salvando ? "Salvando..." : edicao ? "Salvar alterações" : "Salvar veículo"}</button>
      </div>
    </section>
  );
}

function Campo({ rotulo, valor, onChange, tipo = "text" }: { rotulo: string; valor: string; onChange: (valor: string) => void; tipo?: "text" | "number" }) {
  return <label className="text-sm font-medium">{rotulo}<input type={tipo} min={tipo === "number" ? 0 : undefined} value={valor} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900" /></label>;
}
