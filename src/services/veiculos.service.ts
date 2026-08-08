import type { ListagemVeiculos } from "@/core/veiculos";

export type DependenciasVeiculos = {
  listar: () => Promise<ListagemVeiculos>;
};

async function listarPersistidos(): Promise<ListagemVeiculos> {
  const { listarVeiculosPersistidos } = await import(
    "@/lib/veiculos/veiculos.repository"
  );
  return listarVeiculosPersistidos();
}

const DEPENDENCIAS_PADRAO: DependenciasVeiculos = { listar: listarPersistidos };

export async function listarVeiculos(
  dependencias: DependenciasVeiculos = DEPENDENCIAS_PADRAO
): Promise<ListagemVeiculos> {
  try {
    return await dependencias.listar();
  } catch {
    throw new Error("Não foi possível carregar os veículos.");
  }
}
