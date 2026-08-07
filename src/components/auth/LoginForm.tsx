"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { entrar } from "@/services/auth.service";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setCarregando(true); setErro("");
    try { await entrar(email, senha); router.replace("/oportunidades"); }
    catch { setErro("Não foi possível entrar. Verifique o e-mail e a senha."); setCarregando(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><form onSubmit={enviar} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-medium text-slate-500">INATO Central</p><h1 className="mt-1 text-3xl font-bold">Entrar</h1><p className="mt-2 text-sm text-slate-500">Acesse a Plataforma INATO.</p><label className="mt-6 block text-sm font-medium" htmlFor="email">E-mail</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3"/><label className="mt-4 block text-sm font-medium" htmlFor="senha">Senha</label><input id="senha" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3"/>{erro && <p role="alert" className="mt-4 text-sm text-red-700">{erro}</p>}<button disabled={carregando} className="mt-6 w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{carregando ? "Entrando..." : "Entrar"}</button></form></main>;
}
