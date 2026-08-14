import { ROTULOS_MOTIVO_CANCELAMENTO_RESERVA, ROTULOS_STATUS_RESERVA, type Reserva } from "@/core/reservas";
import type { Negociacao } from "@/core/negociacoes";
import type { Veiculo } from "@/core/veiculos";

const data = (valor: string) => new Date(valor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default function ReservasTabela({ reservas, negociacoes, veiculos, podeCancelar, onCancelar }: { reservas: readonly Reserva[]; negociacoes: readonly Negociacao[]; veiculos: readonly Veiculo[]; podeCancelar: boolean; onCancelar: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Veículo", "Interessado", "Situação", "Motivo", "Reservado em", "Reservado até", "Encerrado em", "Ação"].map((rotulo) => <th key={rotulo} className="px-5 py-3">{rotulo}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">
          {reservas.map((reserva) => {
            const negociacao = negociacoes.find(({ id }) => id === reserva.negociacaoId);
            const veiculo = veiculos.find(({ id }) => id === reserva.veiculoId);
            return (
              <tr key={reserva.id}>
                <td className="px-5 py-4">{veiculo ? `${veiculo.placa} — ${[veiculo.marca, veiculo.modelo, veiculo.versao].filter(Boolean).join(" ")}` : "Veículo não identificado"}</td>
                <td className="px-5 py-4">{negociacao?.interessadoNome ?? "—"}</td>
                <td className="px-5 py-4">{ROTULOS_STATUS_RESERVA[reserva.status]}</td>
                <td className="px-5 py-4">{reserva.motivoCancelamento ? ROTULOS_MOTIVO_CANCELAMENTO_RESERVA[reserva.motivoCancelamento] : "—"}</td>
                <td className="px-5 py-4">{data(reserva.reservadoEm)}</td>
                <td className="px-5 py-4 font-semibold">{data(reserva.expiraEm)}</td>
                <td className="px-5 py-4">{reserva.encerradoEm ? data(reserva.encerradoEm) : "—"}</td>
                <td className="px-5 py-4">{reserva.status === "ativa" && podeCancelar ? <button onClick={() => onCancelar(reserva.id)} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700">Cancelar Reserva</button> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
