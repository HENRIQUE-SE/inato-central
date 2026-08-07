import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export async function entrarComEmailSenha(email: string, senha: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  return data.user;
}

export async function sair(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function obterUsuarioAutenticado(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function obterSessaoAutenticada(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
