type FormOportunidadeProps = {
  proprietarioNome: string;
  telefone: string;
  cidade: string;
  veiculoInformado: string;
  placa: string;
  origem: string;
  salvando: boolean;
  onProprietarioNomeChange: (valor: string) => void;
  onTelefoneChange: (valor: string) => void;
  onCidadeChange: (valor: string) => void;
  onVeiculoInformadoChange: (valor: string) => void;
  onPlacaChange: (valor: string) => void;
  onOrigemChange: (valor: string) => void;
  onCancelar: () => void;
  onSalvar: () => void;
};

export default function FormOportunidade({
  proprietarioNome,
  telefone,
  cidade,
  veiculoInformado,
  placa,
  origem,
  salvando,
  onProprietarioNomeChange,
  onTelefoneChange,
  onCidadeChange,
  onVeiculoInformadoChange,
  onPlacaChange,
  onOrigemChange,
  onCancelar,
  onSalvar,
}: FormOportunidadeProps) {
  return (
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
            value={proprietarioNome}
            onChange={(e) =>
              onProprietarioNomeChange(e.target.value)
            }
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
            value={telefone}
            onChange={(e) => onTelefoneChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Cidade
          </label>

          <input
            type="text"
            value={cidade}
            onChange={(e) => onCidadeChange(e.target.value)}
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
            value={veiculoInformado}
            onChange={(e) =>
              onVeiculoInformadoChange(e.target.value)
            }
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
            value={placa}
            onChange={(e) =>
              onPlacaChange(e.target.value.toUpperCase())
            }
            maxLength={7}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Origem
          </label>

          <select
            value={origem}
            onChange={(e) => onOrigemChange(e.target.value)}
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

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar oportunidade"}
        </button>
      </div>
    </section>
  );
}