import VeiculoDetalhes from "@/components/veiculos/VeiculoDetalhes";
import ContextoOperacionalGate from "@/components/contexto-operacional/ContextoOperacionalGate";

export default async function VeiculoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContextoOperacionalGate><VeiculoDetalhes id={id} /></ContextoOperacionalGate>;
}
