import type { Oportunidade } from "@/types/oportunidade";
import StatusBadge from "./StatusBadge";
import ActionButtons from "./ActionButtons";

type CardOportunidadeProps = {
  oportunidade: Oportunidade;
  onEditar: (oportunidade: Oportunidade) => void;
  onExcluir: (id: string) => void;
};

export default function CardOportunidade({
  oportunidade,
  onEditar,
  onExcluir,
}: CardOportunidadeProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {oportunidade.proprietario_nome}
          </h3>

          <p className="text-sm text-slate-500">
            {oportunidade.veiculo_informado}
          </p>
        </div>

        <StatusBadge status={oportunidade.status} />
      </div>

      <p className="mt-2 text-sm font-medium">
        {oportunidade.cidade}
      </p>

      <p className="text-xs text-slate-500">
        {oportunidade.origem}
      </p>

      <ActionButtons
        onVer={() => alert("Visualização em desenvolvimento.")}
       onEditar={() => onEditar(oportunidade)}
        onExcluir={() => onExcluir(oportunidade.id)}
      />
    </div>
  );
}