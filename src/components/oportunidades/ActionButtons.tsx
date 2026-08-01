type ActionButtonsProps = {
  onVer: () => void;
  onEditar: () => void;
  onExcluir: () => void;
};

export default function ActionButtons({
  onVer,
  onEditar,
  onExcluir,
}: ActionButtonsProps) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <button
        onClick={onVer}
        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100"
      >
        👁 Ver
      </button>

      <button
        onClick={onEditar}
        className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
      >
        ✏ Editar
      </button>

      <button
        onClick={onExcluir}
        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        🗑 Excluir
      </button>
    </div>
  );
}