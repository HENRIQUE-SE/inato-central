import { STATUS_VEICULO, type StatusVeiculo, type Veiculo } from "@/core/veiculos";

const ROTULOS: Record<StatusVeiculo, string> = {
  [STATUS_VEICULO.EM_PREPARACAO]: "Em preparação",
  [STATUS_VEICULO.DISPONIVEL]: "Disponível",
  [STATUS_VEICULO.RESERVADO]: "Reservado",
  [STATUS_VEICULO.VENDIDO]: "Vendido",
  [STATUS_VEICULO.CANCELADO]: "Cancelado",
};

export default function VeiculosTabela({ veiculos }: { veiculos: readonly Veiculo[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
          {['Placa', 'Veículo', 'Ano', 'Quilometragem', 'Proprietário', 'Status'].map((titulo) => <th key={titulo} className="px-5 py-3">{titulo}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {veiculos.map((veiculo) => <tr key={veiculo.id}>
            <td className="px-5 py-4 font-semibold">{veiculo.placa}</td>
            <td className="px-5 py-4">{[veiculo.marca, veiculo.modelo, veiculo.versao]
              .map((parte) => parte?.trim().replace(/\s*\.$/, "").trim())
              .filter((parte) => Boolean(parte))
              .join(" ")}</td>
            <td className="px-5 py-4">{veiculo.anoFabricacao}/{veiculo.anoModelo}</td>
            <td className="px-5 py-4">{veiculo.quilometragem.toLocaleString("pt-BR")} km</td>
            <td className="px-5 py-4">{veiculo.proprietarioNome}</td>
            <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{ROTULOS[veiculo.status]}</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
