import {
  ACOES_AUDITORIA,
  ORIGENS_AUDITORIA,
  RESULTADOS_AUDITORIA,
  registrarEventoAuditoria,
} from "@/core/auditoria";
import { obterContextoIdentidadeAtual } from "@/core/identidade";
import type { AcaoAuditoria, ValorAuditoria } from "@/core/auditoria";
import type { Oportunidade } from "@/types/oportunidade";

const MODULO_OPORTUNIDADES = "oportunidades";
const TIPO_RECURSO_OPORTUNIDADE = "oportunidade";

function registrarAuditoriaOportunidade(
  oportunidade: Oportunidade,
  acao: AcaoAuditoria,
  detalhes: Readonly<Record<string, ValorAuditoria>>
): void {
  const contexto = obterContextoIdentidadeAtual();

  registrarEventoAuditoria({
    empresaId: contexto.organizacao.empresaId,
    unidadeId: contexto.organizacao.unidadeId,
    usuarioId: contexto.usuario.id,
    modulo: MODULO_OPORTUNIDADES,
    acao,
    recursoTipo: TIPO_RECURSO_OPORTUNIDADE,
    recursoId: oportunidade.id,
    resultado: RESULTADOS_AUDITORIA.SUCESSO,
    origem: ORIGENS_AUDITORIA.USUARIO,
    detalhes: {
      ...detalhes,
      perfilCodigo: contexto.perfil.codigo,
    },
  });
}

export function registrarAuditoriaCriacaoOportunidade(
  oportunidade: Oportunidade
): void {
  registrarAuditoriaOportunidade(
    oportunidade,
    ACOES_AUDITORIA.CRIAR,
    {
      placa: oportunidade.placa,
      proprietario: oportunidade.proprietario_nome,
      veiculo: oportunidade.veiculo_informado,
    }
  );
}

export function registrarAuditoriaAlteracaoOportunidade(
  oportunidade: Oportunidade
): void {
  registrarAuditoriaOportunidade(
    oportunidade,
    ACOES_AUDITORIA.ALTERAR,
    {
      placa: oportunidade.placa,
      proprietario: oportunidade.proprietario_nome,
    }
  );
}

export function registrarAuditoriaExclusaoOportunidade(
  oportunidade: Oportunidade
): void {
  registrarAuditoriaOportunidade(
    oportunidade,
    ACOES_AUDITORIA.EXCLUIR,
    {
      placa: oportunidade.placa,
    }
  );
}
