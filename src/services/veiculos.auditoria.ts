import {
  ACOES_AUDITORIA,
  ORIGENS_AUDITORIA,
  RESULTADOS_AUDITORIA,
  registrarEventoAuditoria,
  type RegistroAuditoria,
} from "@/core/auditoria";
import type { ContextoAcesso } from "@/core/acesso";
import type { Veiculo } from "@/core/veiculos";
import { obterContextoAcessoAtual } from "./acesso.service";
import { obterUsuarioAtualAutenticado, type UsuarioAutenticado } from "./auth.service";

export type DependenciasAuditoriaVeiculos = {
  obterUsuario: () => Promise<UsuarioAutenticado | null>;
  obterContextoAcesso: () => Promise<ContextoAcesso | null>;
  persistir: (evento: RegistroAuditoria) => Promise<RegistroAuditoria>;
};

async function persistir(evento: RegistroAuditoria): Promise<RegistroAuditoria> {
  const { persistirEventoAuditoria } = await import("@/lib/auditoria/auditoria.repository");
  return persistirEventoAuditoria(evento);
}

const DEPENDENCIAS_PADRAO: DependenciasAuditoriaVeiculos = {
  obterUsuario: obterUsuarioAtualAutenticado,
  obterContextoAcesso: obterContextoAcessoAtual,
  persistir,
};

export async function registrarAuditoriaCriacaoVeiculo(
  veiculo: Veiculo,
  dependencias: DependenciasAuditoriaVeiculos = DEPENDENCIAS_PADRAO
): Promise<void> {
  try {
    const [usuario, contexto] = await Promise.all([
      dependencias.obterUsuario(),
      dependencias.obterContextoAcesso(),
    ]);
    if (usuario === null || contexto === null) throw new Error("sem contexto");
    const evento = registrarEventoAuditoria({
      empresaId: contexto.vinculo.empresaId,
      unidadeId: contexto.vinculo.unidadeId,
      usuarioId: usuario.id,
      modulo: "veiculos",
      acao: ACOES_AUDITORIA.CRIAR,
      recursoTipo: "veiculo",
      recursoId: veiculo.id,
      resultado: RESULTADOS_AUDITORIA.SUCESSO,
      origem: ORIGENS_AUDITORIA.USUARIO,
      detalhes: {
        placa: veiculo.placa,
        proprietario: veiculo.proprietarioNome,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        status: veiculo.status,
        oportunidadeId: veiculo.oportunidadeId,
        perfilCodigo: contexto.perfil.codigo,
        usuarioEmail: usuario.email,
      },
    });
    await dependencias.persistir(evento);
  } catch {
    throw new Error("Não foi possível registrar a auditoria do veículo.");
  }
}

export async function registrarAuditoriaAlteracaoVeiculo(
  veiculo: Veiculo,
  camposAlterados: readonly string[],
  dependencias: DependenciasAuditoriaVeiculos = DEPENDENCIAS_PADRAO
): Promise<void> {
  try {
    const [usuario, contexto] = await Promise.all([
      dependencias.obterUsuario(),
      dependencias.obterContextoAcesso(),
    ]);
    if (usuario === null || contexto === null) throw new Error("sem contexto");
    const evento = registrarEventoAuditoria({
      empresaId: contexto.vinculo.empresaId,
      unidadeId: contexto.vinculo.unidadeId,
      usuarioId: usuario.id,
      modulo: "veiculos",
      acao: ACOES_AUDITORIA.ALTERAR,
      recursoTipo: "veiculo",
      recursoId: veiculo.id,
      resultado: RESULTADOS_AUDITORIA.SUCESSO,
      origem: ORIGENS_AUDITORIA.USUARIO,
      detalhes: {
        placa: veiculo.placa,
        proprietario: veiculo.proprietarioNome,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        status: veiculo.status,
        perfilCodigo: contexto.perfil.codigo,
        usuarioEmail: usuario.email,
        camposAlterados: [...camposAlterados],
      },
    });
    await dependencias.persistir(evento);
  } catch {
    throw new Error("Não foi possível registrar a auditoria do veículo.");
  }
}
