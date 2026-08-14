import type {
  ListarEventosAuditoriaPersistidosParametros,
  ListarEventosAuditoriaPersistidosResultado,
} from "@/lib/auditoria/auditoria.repository";
import {
  obterUsuarioAtualAutenticado,
  type UsuarioAutenticado,
} from "./auth.service";
import type {
  AcaoAuditoria,
  RegistroAuditoria,
  ResultadoAuditoria,
  ValorAuditoria,
} from "@/core/auditoria";

export type AuditoriaItem = {
  id: string;
  data: string;
  hora: string;
  usuario: string;
  perfil: string;
  modulo: string;
  acao: string;
  resultado: string;
  recurso: string;
  placa: string;
};

export type ListarAuditoriaParametros = ListarEventosAuditoriaPersistidosParametros;

export type ListarAuditoriaResultado = {
  dados: AuditoriaItem[];
  total: number;
  pagina: number;
  itensPorPagina: number;
  totalPaginas: number;
};

type ConsultarPersistencia = (
  parametros: ListarEventosAuditoriaPersistidosParametros
) => Promise<ListarEventosAuditoriaPersistidosResultado>;
type ResolverUsuarioAutenticado = () => Promise<UsuarioAutenticado | null>;

async function consultarPersistencia(
  parametros: ListarEventosAuditoriaPersistidosParametros
): Promise<ListarEventosAuditoriaPersistidosResultado> {
  const { listarEventosAuditoriaPersistidos } = await import(
    "@/lib/auditoria/auditoria.repository"
  );
  return listarEventosAuditoriaPersistidos(parametros);
}

const ROTULOS_ACAO: Record<AcaoAuditoria, string> = {
  criar: "Criou",
  alterar: "Alterou",
  excluir: "Excluiu",
  visualizar: "Visualizou",
  entrar: "Entrou",
  sair: "Saiu",
};

const ROTULOS_RESULTADO: Record<ResultadoAuditoria, string> = {
  sucesso: "Sucesso",
  falha: "Falha",
};

function textoDetalhe(
  detalhes: Readonly<Record<string, ValorAuditoria>> | null,
  chave: string
): string {
  const valor = detalhes?.[chave];
  return typeof valor === "string" ? valor : "—";
}

function transformarRegistro(
  registro: RegistroAuditoria,
  usuarioAtual: UsuarioAutenticado | null
): AuditoriaItem {
  const instante = new Date(registro.criadoEm);
  const usuarioEmail = textoDetalhe(registro.detalhes, "usuarioEmail");
  const expiracaoAutomatica = registro.origem === "sistema"
    && textoDetalhe(registro.detalhes, "autoria") === "sistema"
    && textoDetalhe(registro.detalhes, "motivo") === "expiracao_24_horas";

  return {
    id: registro.id,
    data: instante.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    hora: instante.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
    }),
    usuario: expiracaoAutomatica
      ? "Sistema"
      : usuarioEmail !== "—"
      ? usuarioEmail
      : usuarioAtual !== null && registro.usuarioId === usuarioAtual.id
        ? usuarioAtual.email || "Usuário autenticado"
        : "Usuário não identificado",
    perfil: textoDetalhe(registro.detalhes, "perfilCodigo"),
    modulo:
      registro.modulo === "oportunidades"
        ? "Oportunidades"
        : registro.modulo,
    acao: expiracaoAutomatica ? "Expirou" : ROTULOS_ACAO[registro.acao],
    resultado: ROTULOS_RESULTADO[registro.resultado],
    recurso: registro.recursoTipo,
    placa: textoDetalhe(registro.detalhes, "placa"),
  };
}

export async function listarAuditoria(
  parametros: ListarAuditoriaParametros = {},
  consultar: ConsultarPersistencia = consultarPersistencia,
  resolverUsuario: ResolverUsuarioAutenticado = obterUsuarioAtualAutenticado
): Promise<ListarAuditoriaResultado> {
  const parametrosNormalizados = {
    ...parametros,
    pagina: Math.max(1, parametros.pagina ?? 1),
    itensPorPagina: parametros.itensPorPagina ?? 10,
  };

  try {
    const [resultado, usuarioAtual] = await Promise.all([
      consultar(parametrosNormalizados),
      resolverUsuario(),
    ]);
    return {
      dados: resultado.dados.map((registro) =>
        transformarRegistro(registro, usuarioAtual)
      ),
      total: resultado.total,
      pagina: resultado.pagina,
      itensPorPagina: resultado.itensPorPagina,
      totalPaginas: Math.max(1, Math.ceil(resultado.total / resultado.itensPorPagina)),
    };
  } catch {
    throw new Error("Não foi possível carregar a auditoria.");
  }
}
