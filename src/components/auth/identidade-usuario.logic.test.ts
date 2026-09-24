import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { CODIGOS_PERFIL_ACESSO, type CodigoPerfilAcesso, type ContextoAcesso } from "@/core/acesso";
import type { ContextoAcessoAutenticado } from "@/services/acesso.service";
import { criarIdentidadeUsuarioVisual } from "./identidade-usuario.logic";

function autoridade(
  email: string,
  perfilNome: string,
  perfilCodigo: CodigoPerfilAcesso = CODIGOS_PERFIL_ACESSO.ADMINISTRADOR
): ContextoAcessoAutenticado {
  const contexto: ContextoAcesso = {
    vinculo: {
      id: "vinculo-1", usuarioId: "usuario-1", redeId: "rede-1", operacaoId: "operacao-1",
      areaOperacionalId: "area-1", empresaId: "empresa-1", unidadeId: "unidade-1",
      escopoTipo: "unidade", perfilId: "perfil-1", ativo: true, criadoEm: "2026-09-24T00:00:00.000Z",
    },
    perfil: {
      id: "perfil-1", codigo: perfilCodigo, nome: perfilNome, descricao: null,
      ativo: true, criadoEm: "2026-09-24T00:00:00.000Z",
    },
    permissoes: [],
  };
  return { usuario: { id: "usuario-1", email }, contexto };
}

test("Administrador apresenta perfil persistido e e-mail autenticado", () => {
  assert.deepEqual(criarIdentidadeUsuarioVisual(autoridade("adm@inatoveiculos.com.br", "Administrador")), {
    perfil: "Administrador",
    identificacao: "adm@inatoveiculos.com.br",
    inicial: "A",
  });
});

test("perfil visual corresponde ao perfil autenticado e não a literal TESTE", () => {
  assert.equal(criarIdentidadeUsuarioVisual(autoridade("consultor@inato.test", "Consultor"))?.perfil, "Consultor");
});

test("troca de usuário altera identificação e inicial apresentadas", () => {
  const primeiro = criarIdentidadeUsuarioVisual(autoridade("adm@inato.test", "Administrador"));
  const segundo = criarIdentidadeUsuarioVisual(autoridade("consultor@inato.test", "Consultor"));
  assert.notDeepEqual(primeiro, segundo);
  assert.equal(primeiro?.inicial, "A");
  assert.equal(segundo?.inicial, "C");
});

test("nome persistido vazio usa código humanizado deterministicamente", () => {
  assert.equal(criarIdentidadeUsuarioVisual(autoridade("super@inato.test", "", "super_admin"))?.perfil, "Super Admin");
});

test("identificação vazia não produz identidade fictícia", () => {
  assert.equal(criarIdentidadeUsuarioVisual(autoridade("  ", "Administrador")), null);
});

test("Dashboard não mantém identidade TESTE hardcoded e usa componente real", () => {
  const dashboard = readFileSync(resolve("src/app/page.tsx"), "utf8");
  assert.match(dashboard, /IdentidadeUsuarioAtual/);
  assert.doesNotMatch(dashboard, /Perfil TESTE|Usuário de treinamento|>\s*T\s*</);
});

test("carregamento da identidade usa apresentação neutra", () => {
  const componente = readFileSync(resolve("src/components/auth/IdentidadeUsuarioAtual.tsx"), "utf8");
  assert.match(componente, /Carregando identidade/);
  assert.doesNotMatch(componente, /Perfil TESTE|Usuário de treinamento/);
});
