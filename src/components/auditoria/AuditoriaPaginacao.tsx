type Props = {
  pagina: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
};

export default function AuditoriaPaginacao({ pagina, totalPaginas, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-4 text-sm sm:px-6">
      <button disabled={pagina <= 1} onClick={() => onChange(Math.max(1, pagina - 1))} className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
      <span>Página {pagina} de {totalPaginas}</span>
      <button disabled={pagina >= totalPaginas} onClick={() => onChange(Math.min(totalPaginas, pagina + 1))} className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
    </div>
  );
}
