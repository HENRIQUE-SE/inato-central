import NegociacaoDetalhes from "@/components/negociacoes/NegociacaoDetalhes";
import ContextoOperacionalGate from "@/components/contexto-operacional/ContextoOperacionalGate";
export default async function NegociacaoPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <ContextoOperacionalGate><NegociacaoDetalhes id={id}/></ContextoOperacionalGate>}
