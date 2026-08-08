export const STATUS_VEICULO = {
  EM_PREPARACAO: "em_preparacao",
  DISPONIVEL: "disponivel",
  RESERVADO: "reservado",
  VENDIDO: "vendido",
  CANCELADO: "cancelado",
} as const;

export type StatusVeiculo =
  (typeof STATUS_VEICULO)[keyof typeof STATUS_VEICULO];
