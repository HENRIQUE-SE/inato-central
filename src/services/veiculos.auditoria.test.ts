import assert from "node:assert/strict";
import { test } from "node:test";
import { STATUS_VEICULO, type Veiculo } from "@/core/veiculos";
import type { ContextoAcesso } from "@/core/acesso";
import type { RegistroAuditoria } from "@/core/auditoria";
import { registrarAuditoriaAlteracaoVeiculo, registrarAuditoriaCriacaoVeiculo } from "./veiculos.auditoria";

const VEICULO: Veiculo = {
  id: "veiculo-1", empresaId: "empresa-1", unidadeId: "unidade-1",
  oportunidadeId: "oportunidade-1", proprietarioNome: "Proprietário",
  placa: "ABC1D23", renavam: "123", chassi: "CHASSI", marca: "Marca",
  modelo: "Modelo", versao: null, anoFabricacao: 2025, anoModelo: 2026,
  cor: "Preto", quilometragem: 123, codigoFipe: null,
  status: STATUS_VEICULO.EM_PREPARACAO, criadoEm: "2026-08-08T00:00:00.000Z",
  atualizadoEm: "2026-08-08T00:00:00.000Z", arquivadoEm: null,
};

const CONTEXTO: ContextoAcesso = {
  vinculo: { id: "v", usuarioId: "usuario-1", empresaId: "empresa-1", unidadeId: "unidade-1", perfilId: "p", ativo: true, criadoEm: "2026-08-08T00:00:00.000Z" },
  perfil: { id: "p", codigo: "administrador", nome: "Administrador", descricao: null, ativo: true, criadoEm: "2026-08-08T00:00:00.000Z" },
  permissoes: [],
};

test("registra e persiste a criação do veículo com os detalhes permitidos", async () => {
  let persistido: RegistroAuditoria | null = null;
  await registrarAuditoriaCriacaoVeiculo(VEICULO, {
    obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }),
    obterContextoAcesso: async () => CONTEXTO,
    persistir: async (evento) => { persistido = evento; return evento; },
  });
  assert.ok(persistido);
  const evento: RegistroAuditoria = persistido;
  assert.equal(evento.acao, "criar");
  assert.equal(evento.modulo, "veiculos");
  assert.equal(evento.recursoTipo, "veiculo");
  assert.equal(evento.recursoId, "veiculo-1");
  assert.equal(evento.resultado, "sucesso");
  assert.equal(evento.origem, "usuario");
  assert.equal(evento.usuarioId, "usuario-1");
  assert.deepEqual(evento.detalhes, {
    placa: "ABC1D23", proprietario: "Proprietário", marca: "Marca",
    modelo: "Modelo", status: "em_preparacao", oportunidadeId: "oportunidade-1",
    perfilCodigo: "administrador", usuarioEmail: "usuario@inato.test",
  });
  assert.equal("renavam" in (evento.detalhes ?? {}), false);
  assert.equal("chassi" in (evento.detalhes ?? {}), false);
});

test("converte falha técnica da persistência da auditoria", async () => {
  await assert.rejects(registrarAuditoriaCriacaoVeiculo(VEICULO, {
    obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }),
    obterContextoAcesso: async () => CONTEXTO,
    persistir: async () => { throw new Error("erro técnico"); },
  }), new Error("Não foi possível registrar a auditoria do veículo."));
});

test("registra alteração com campos alterados e sem dados automotivos sensíveis", async () => {
  let persistido: RegistroAuditoria | null = null;
  await registrarAuditoriaAlteracaoVeiculo(VEICULO, ["cor", "quilometragem"], {
    obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }),
    obterContextoAcesso: async () => CONTEXTO,
    persistir: async (evento) => { persistido = evento; return evento; },
  });
  assert.ok(persistido);
  const evento: RegistroAuditoria = persistido;
  assert.equal(evento.acao, "alterar");
  assert.equal(evento.modulo, "veiculos");
  assert.equal(evento.recursoId, "veiculo-1");
  assert.equal(evento.detalhes?.perfilCodigo, "administrador");
  assert.equal(evento.detalhes?.usuarioEmail, "usuario@inato.test");
  assert.deepEqual(evento.detalhes?.camposAlterados, ["cor", "quilometragem"]);
  assert.equal("renavam" in (evento.detalhes ?? {}), false);
  assert.equal("chassi" in (evento.detalhes ?? {}), false);
});
