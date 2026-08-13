import NegociacaoDetalhes from "@/components/negociacoes/NegociacaoDetalhes";
export default async function NegociacaoPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <NegociacaoDetalhes id={id}/>}
