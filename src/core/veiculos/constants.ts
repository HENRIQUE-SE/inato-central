export const STATUS_VEICULO = {
  EM_PREPARACAO: "em_preparacao",
  PRONTO_PARA_ANUNCIAR: "pronto_para_anunciar",
  DISPONIVEL: "disponivel",
  RESERVADO: "reservado",
  VENDIDO: "vendido",
  CANCELADO: "cancelado",
} as const;

export type StatusVeiculo =
  (typeof STATUS_VEICULO)[keyof typeof STATUS_VEICULO];

export const ROTULOS_STATUS_VEICULO: Readonly<Record<StatusVeiculo, string>> = {
  [STATUS_VEICULO.EM_PREPARACAO]: "Em preparação",
  [STATUS_VEICULO.PRONTO_PARA_ANUNCIAR]: "Pronto para anunciar",
  [STATUS_VEICULO.DISPONIVEL]: "Disponível",
  [STATUS_VEICULO.RESERVADO]: "Reservado",
  [STATUS_VEICULO.VENDIDO]: "Vendido",
  [STATUS_VEICULO.CANCELADO]: "Cancelado",
};
