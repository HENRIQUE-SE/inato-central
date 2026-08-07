export default function AcessoNegado() {
  return (
    <div role="alert" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <h2 className="text-xl font-semibold">Acesso não autorizado.</h2>
      <p className="mt-2 text-sm text-slate-600">Seu perfil não possui permissão para acessar esta área.</p>
    </div>
  );
}
