import type { AuditoriaItem } from "@/services/auditoria.service";

export default function AuditoriaTabela({ dados }: { dados: AuditoriaItem[] }) {
  const campos: Array<[keyof AuditoriaItem, string]> = [["data", "Data"], ["hora", "Hora"], ["usuario", "Usuário"], ["perfil", "Perfil"], ["modulo", "Módulo"], ["acao", "Ação"], ["resultado", "Resultado"], ["recurso", "Recurso"], ["placa", "Placa"]];
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50"><tr>{campos.map(([, rotulo]) => <th key={rotulo} className="whitespace-nowrap px-4 py-3 font-semibold">{rotulo}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">{dados.map((item) => <tr key={item.id}>{campos.map(([campo]) => <td key={campo} className="whitespace-nowrap px-4 py-3 text-slate-700">{item[campo]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
