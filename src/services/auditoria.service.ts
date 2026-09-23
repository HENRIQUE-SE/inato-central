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
import { CODIGOS_PERMISSAO_ACESSO, possuiPermissao } from "@/core/acesso";
import type { ContextoOperacionalAtivo } from "@/core/organizacao";
import { obterUnidadeAtual } from "@/core/organizacao";
import {
  obterContextoAcessoAutenticadoAtual,
  type ContextoAcessoAutenticado,
} from "./acesso.service";

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

export type ListarAuditoriaParametros = Omit<ListarEventosAuditoriaPersistidosParametros, "contexto">;

export type ListarAuditoriaResultado = {
  dados: AuditoriaItem[];
  total: number;
  pagina: number;
  itensPorPagina: number;
  totalPaginas: number;
};

type ConsultarPersistencia = (
  parametros: ListarAuditoriaParametros,
  sinal?: AbortSignal,
  contexto?: ContextoOperacionalAtivo
) => Promise<ListarEventosAuditoriaPersistidosResultado>;
type ResolverUsuarioAutenticado = () => Promise<UsuarioAutenticado | null>;

export type ResultadoTelaAuditoria =
  | { estado: "nao_autenticado" }
  | { estado: "acesso_negado" }
  | {
      estado: "carregado";
      auditoria: ListarAuditoriaResultado;
      usuarioVisivel: { email: string; perfil: string; unidade: string };
    };

export type DependenciasTelaAuditoria = {
  obterAutoridade: () => Promise<ContextoAcessoAutenticado | null>;
  obterContextoOperacional: () => Promise<ContextoOperacionalAtivo>;
  listar: (parametros: ListarAuditoriaParametros, usuario: UsuarioAutenticado, contexto: ContextoOperacionalAtivo, sinal?: AbortSignal) => Promise<ListarAuditoriaResultado>;
};

const DEPENDENCIAS_TELA: DependenciasTelaAuditoria = {
  obterAutoridade: () => obterContextoAcessoAutenticadoAtual(),
  obterContextoOperacional: async () => (await import("./contexto-operacional.service")).exigirContextoOperacionalAtivoAtual(),
  listar: (parametros, usuario, contexto, sinal) => listarAuditoria(parametros, undefined, async () => usuario, sinal, contexto),
};

async function consultarPersistencia(
  parametros: ListarAuditoriaParametros,
  sinal?: AbortSignal,
  contexto?: ContextoOperacionalAtivo
): Promise<ListarEventosAuditoriaPersistidosResultado> {
  const { listarEventosAuditoriaPersistidos } = await import(
    "@/lib/auditoria/auditoria.repository"
  );
  if (contexto === undefined) throw new Error("Contexto operacional não selecionado.");
  return listarEventosAuditoriaPersistidos({ ...parametros, contexto }, sinal);
}

export class ErroConsultaAuditoriaCancelada extends Error {
  constructor() {
    super("Consulta de auditoria cancelada.");
    this.name = "ErroConsultaAuditoriaCancelada";
  }
}

export function ehErroConsultaAuditoriaCancelada(erro: unknown): erro is ErroConsultaAuditoriaCancelada {
  return erro instanceof ErroConsultaAuditoriaCancelada;
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
  resolverUsuario: ResolverUsuarioAutenticado = obterUsuarioAtualAutenticado,
  sinal?: AbortSignal,
  contexto?: ContextoOperacionalAtivo
): Promise<ListarAuditoriaResultado> {

  const parametrosNormalizados = {
    ...parametros,
    pagina: Math.max(1, parametros.pagina ?? 1),
    itensPorPagina: parametros.itensPorPagina ?? 10,
  };

  try {

    const [resultado, usuarioAtual] = await Promise.all([
      consultar(parametrosNormalizados, sinal, contexto),
      resolverUsuario(),
    ]);


    const resposta = {
      dados: resultado.dados.map((registro) =>
        transformarRegistro(registro, usuarioAtual)
      ),
      total: resultado.total,
      pagina: resultado.pagina,
      itensPorPagina: resultado.itensPorPagina,
      totalPaginas: Math.max(1, Math.ceil(resultado.total / resultado.itensPorPagina)),
    };


    return resposta;
  } catch {
    if (sinal?.aborted) {

      throw new ErroConsultaAuditoriaCancelada();
    }
    throw new Error("Não foi possível carregar a auditoria.");
  }
}

export async function obterDadosAuditoriaParaTela(
  parametros: ListarAuditoriaParametros = {},
  dependencias: DependenciasTelaAuditoria = DEPENDENCIAS_TELA,
  sinal?: AbortSignal
): Promise<ResultadoTelaAuditoria> {


  const autoridade = await dependencias.obterAutoridade();

  if (autoridade === null) return { estado: "nao_autenticado" };
  if (!possuiPermissao(autoridade.contexto, CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR)) {
    return { estado: "acesso_negado" };
  }
  const contextoOperacional = await dependencias.obterContextoOperacional();

  const unidade = obterUnidadeAtual();
  const usuarioVisivel = {
    email: autoridade.usuario.email,
    perfil: autoridade.contexto.perfil.nome,
    unidade: autoridade.contexto.vinculo.unidadeId === unidade.id ? unidade.nome : "Unidade não identificada",
  };

  const auditoria = await dependencias.listar(parametros, autoridade.usuario, contextoOperacional, sinal);
  return { estado: "carregado", auditoria, usuarioVisivel };
}

export function criarCarregadorAuditoriaParaTela(
  carregar: (parametros: ListarAuditoriaParametros, sinal?: AbortSignal) => Promise<ResultadoTelaAuditoria> =
    (parametros, sinal) => obterDadosAuditoriaParaTela(parametros, undefined, sinal)
): (parametros: ListarAuditoriaParametros) => Promise<ResultadoTelaAuditoria> {
  const cargasEmAndamento = new Map<string, Promise<ResultadoTelaAuditoria>>();
  let cargaEfetiva: { chave: string; controlador: AbortController } | null = null;
  return (parametros) => {
    const chave = JSON.stringify({
      pagina: parametros.pagina ?? 1,
      itensPorPagina: parametros.itensPorPagina ?? 10,
      termoPesquisa: parametros.termoPesquisa ?? "",
      modulo: parametros.modulo ?? "",
      acao: parametros.acao ?? "",
      resultado: parametros.resultado ?? "",
    });
    const existente = cargasEmAndamento.get(chave);
    if (existente) return existente;
    if (cargaEfetiva !== null && cargaEfetiva.chave !== chave) {
      cargasEmAndamento.delete(cargaEfetiva.chave);
      cargaEfetiva.controlador.abort();
    }
    const controlador = new AbortController();
    cargaEfetiva = { chave, controlador };
    const atual = carregar(parametros, controlador.signal);
    const compartilhada = atual.finally(() => {
      if (cargasEmAndamento.get(chave) === compartilhada) cargasEmAndamento.delete(chave);
      if (cargaEfetiva?.chave === chave && cargaEfetiva.controlador === controlador) cargaEfetiva = null;
    });
    cargasEmAndamento.set(chave, compartilhada);
    return compartilhada;
  };
}
