import { ACOES_AUDITORIA, ORIGENS_AUDITORIA, RESULTADOS_AUDITORIA, registrarEventoAuditoria } from "@/core/auditoria";
import { obterContextoIdentidadeAtual } from "@/core/identidade";
import { obterUsuarioAtualAutenticado, type UsuarioAutenticado } from "./auth.service";
import { obterContextoAcessoAtual } from "./acesso.service";
import type { ContextoAcesso } from "@/core/acesso";
import type { AcaoAuditoria, RegistroAuditoria, ValorAuditoria } from "@/core/auditoria";
import type { Oportunidade } from "@/types/oportunidade";

type Dependencias = {
  obterUsuario: () => Promise<UsuarioAutenticado | null>;
  obterContextoAcesso: () => Promise<ContextoAcesso | null>;
  persistir: (evento: RegistroAuditoria) => Promise<RegistroAuditoria>;
};

async function persistirPadrao(evento: RegistroAuditoria): Promise<RegistroAuditoria> {
  const { persistirEventoAuditoria } = await import("@/lib/auditoria/auditoria.repository");
  return persistirEventoAuditoria(evento);
}

const DEPENDENCIAS_PADRAO: Dependencias = {
  obterUsuario: obterUsuarioAtualAutenticado,
  obterContextoAcesso: obterContextoAcessoAtual,
  persistir: persistirPadrao,
};

async function registrar(
  oportunidade: Oportunidade,
  acao: AcaoAuditoria,
  detalhes: Readonly<Record<string, ValorAuditoria>>,
  dependencias: Dependencias
): Promise<void> {
  const contexto = obterContextoIdentidadeAtual();
  const usuario = await dependencias.obterUsuario();
  const contextoAcesso = usuario === null ? null : await dependencias.obterContextoAcesso();
  const perfilCodigo = usuario === null
    ? contexto.perfil.codigo
    : contextoAcesso?.perfil.codigo;
  const evento = registrarEventoAuditoria({
    empresaId: contexto.organizacao.empresaId,
    unidadeId: contexto.organizacao.unidadeId,
    usuarioId: null,
    modulo: "oportunidades",
    acao,
    recursoTipo: "oportunidade",
    recursoId: oportunidade.id,
    resultado: RESULTADOS_AUDITORIA.SUCESSO,
    origem: ORIGENS_AUDITORIA.USUARIO,
    detalhes: {
      ...detalhes,
      ...(perfilCodigo === undefined ? {} : { perfilCodigo }),
      ...(usuario?.email ? { usuarioEmail: usuario.email } : {}),
    },
  });
  if (usuario !== null) {
    await dependencias.persistir({ ...evento, usuarioId: usuario.id });
  }
}

export function registrarAuditoriaCriacaoOportunidade(oportunidade: Oportunidade, dependencias: Dependencias = DEPENDENCIAS_PADRAO): Promise<void> {
  return registrar(oportunidade, ACOES_AUDITORIA.CRIAR, { placa: oportunidade.placa, proprietario: oportunidade.proprietario_nome, veiculo: oportunidade.veiculo_informado }, dependencias);
}
export function registrarAuditoriaAlteracaoOportunidade(oportunidade: Oportunidade, dependencias: Dependencias = DEPENDENCIAS_PADRAO): Promise<void> {
  return registrar(oportunidade, ACOES_AUDITORIA.ALTERAR, { placa: oportunidade.placa, proprietario: oportunidade.proprietario_nome }, dependencias);
}
export function registrarAuditoriaExclusaoOportunidade(oportunidade: Oportunidade, dependencias: Dependencias = DEPENDENCIAS_PADRAO): Promise<void> {
  return registrar(oportunidade, ACOES_AUDITORIA.EXCLUIR, { placa: oportunidade.placa }, dependencias);
}
