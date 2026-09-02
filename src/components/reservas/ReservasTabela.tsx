import { ROTULOS_MOTIVO_CANCELAMENTO_RESERVA, ROTULOS_STATUS_RESERVA, type ReservaListagem } from "@/core/reservas";

const data = (valor: string) => new Date(valor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default function ReservasTabela({ reservas, podeCancelar, onCancelar }: { reservas: readonly ReservaListagem[]; podeCancelar: boolean; onCancelar: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Veículo", "Interessado", "Situação", "Motivo", "Reservado em", "Reservado até", "Encerrado em", "Ação"].map((rotulo) => <th key={rotulo} className="px-5 py-3">{rotulo}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">
          {reservas.map((reserva) => {
            return (
              <tr key={reserva.id}>
                <td className="px-5 py-4">{reserva.veiculoResumo ? `${reserva.veiculoResumo.placa} — ${[reserva.veiculoResumo.marca, reserva.veiculoResumo.modelo, reserva.veiculoResumo.versao].filter(Boolean).join(" ")}` : "Veículo não identificado"}</td>
                <td className="px-5 py-4">{reserva.interessadoNome ?? "—"}</td>
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
