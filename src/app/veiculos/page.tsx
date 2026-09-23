import VeiculosContainer from "@/components/veiculos/VeiculosContainer";
import ContextoOperacionalGate from "@/components/contexto-operacional/ContextoOperacionalGate";

export default function VeiculosPage() {
  return <ContextoOperacionalGate><VeiculosContainer /></ContextoOperacionalGate>;
}
