import type { OrigemNegociacao, StatusNegociacao } from "./constants";

export type Negociacao = {
  id: string; empresaId: string; unidadeId: string; veiculoId: string;
  interessadoNome: string; interessadoTelefone: string; origem: OrigemNegociacao;
  observacoes: string | null; status: StatusNegociacao; criadoPorUsuarioId: string;
  criadoEm: string; atualizadoEm: string; encerradoEm: string | null;
};
export type DadosCriacaoNegociacao = Pick<Negociacao, "empresaId" | "unidadeId" | "veiculoId" | "interessadoNome" | "interessadoTelefone" | "origem" | "observacoes" | "criadoPorUsuarioId">;
export type DadosAtualizacaoNegociacao = Pick<Negociacao, "interessadoNome" | "interessadoTelefone" | "origem" | "observacoes">;
export type CampoAtualizavelNegociacao = keyof DadosAtualizacaoNegociacao;
export type ResultadoValidacaoNegociacao = { valido: true } | { valido: false; campo: string; mensagem: string };
export type ResultadoValidacaoTransicaoNegociacao = { valido: true } | { valido: false; mensagem: string };
export type FiltrosNegociacoes = { pesquisa?: string; status?: StatusNegociacao | "todos"; pagina?: number; itensPorPagina?: number };
export type ListagemNegociacoes = { dados: readonly Negociacao[]; total: number; pagina: number; itensPorPagina: number };
