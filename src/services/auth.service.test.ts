import assert from "node:assert/strict";
import { test } from "node:test";
import { entrar, obterSessaoAtualAutenticada, obterUsuarioAtualAutenticado, sairDaPlataforma } from "./auth.service";

type DependenciasTeste = {
  entrarComEmailSenha: () => Promise<{ id: string; email: string; password?: string }>;
  sair: () => Promise<void>;
  obterUsuarioAutenticado: () => Promise<{ id: string; email: string } | null>;
  obterSessaoAutenticada: () => Promise<{ user: { id: string; email: string }; expires_at: number } | null>;
};

function dependencias(): DependenciasTeste {
  return {
    entrarComEmailSenha: async () => ({ id: "usuario-1", email: "teste@inato.com", password: "não deve retornar" }),
    sair: async () => undefined,
    obterUsuarioAutenticado: async () => ({ id: "usuario-1", email: "teste@inato.com" }),
    obterSessaoAutenticada: async () => ({ user: { id: "usuario-1", email: "teste@inato.com" }, expires_at: 123 }),
  };
}

test("entrada bem-sucedida devolve usuário sanitizado", async () => { assert.deepEqual(await entrar("teste@inato.com", "segredo", dependencias()), { id: "usuario-1", email: "teste@inato.com" }); });
test("erro de entrada é convertido", async () => { const deps = dependencias(); deps.entrarComEmailSenha = async () => { throw new Error("técnico"); }; await assert.rejects(entrar("x", "y", deps), /Não foi possível entrar/); });
test("saída é executada", async () => { let saiu = false; const deps = dependencias(); deps.sair = async () => { saiu = true; }; await sairDaPlataforma(deps); assert.equal(saiu, true); });
test("obtém usuário", async () => { assert.equal((await obterUsuarioAtualAutenticado(dependencias()))?.id, "usuario-1"); });
test("obtém sessão sem expor token", async () => { assert.deepEqual(await obterSessaoAtualAutenticada(dependencias()), { usuarioId: "usuario-1", expiraEm: 123 }); });
test("trata ausência de sessão", async () => { const deps = dependencias(); deps.obterSessaoAutenticada = async () => null; assert.equal(await obterSessaoAtualAutenticada(deps), null); });
test("nenhuma senha é retornada", async () => { assert.equal("password" in await entrar("a", "segredo", dependencias()), false); });
test("serviço não mantém senha entre chamadas", async () => { const primeiro = await entrar("a", "primeira", dependencias()); const segundo = await entrar("a", "segunda", dependencias()); assert.deepEqual(primeiro, segundo); assert.equal(JSON.stringify(segundo).includes("segunda"), false); });
