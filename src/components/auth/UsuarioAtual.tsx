type Props = { email: string; perfil: string; unidade: string };

export default function UsuarioAtual({ email, perfil, unidade }: Props) {
  return (
    <section className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm sm:grid-cols-3">
      <div><span className="block text-slate-500">Usuário:</span><strong>{email}</strong></div>
      <div><span className="block text-slate-500">Perfil:</span><strong>{perfil}</strong></div>
      <div><span className="block text-slate-500">Unidade:</span><strong>{unidade}</strong></div>
    </section>
  );
}
