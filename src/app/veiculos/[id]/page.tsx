import VeiculoDetalhes from "@/components/veiculos/VeiculoDetalhes";

export default async function VeiculoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VeiculoDetalhes id={id} />;
}
