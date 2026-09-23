import OportunidadesContainer from "@/components/oportunidades/OportunidadesContainer";
import ContextoOperacionalGate from "@/components/contexto-operacional/ContextoOperacionalGate";

export default function OportunidadesPage() {
  return <ContextoOperacionalGate><OportunidadesContainer /></ContextoOperacionalGate>;
}
