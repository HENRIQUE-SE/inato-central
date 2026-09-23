import AuditoriaContainer from "@/components/auditoria/AuditoriaContainer";
import ContextoOperacionalGate from "@/components/contexto-operacional/ContextoOperacionalGate";

export default function AuditoriaPage() {
  return <ContextoOperacionalGate><AuditoriaContainer /></ContextoOperacionalGate>;
}
