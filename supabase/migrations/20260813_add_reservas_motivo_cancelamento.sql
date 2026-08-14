alter table public.reservas
  add column motivo_cancelamento text null,
  add column motivo_cancelamento_detalhes text null;

update public.reservas
set motivo_cancelamento = 'anterior_a_regra'
where status = 'cancelada'
  and motivo_cancelamento is null;

alter table public.reservas add constraint reservas_motivo_cancelamento_check check (
  (status in ('ativa','expirada') and motivo_cancelamento is null and motivo_cancelamento_detalhes is null)
  or
  (status = 'cancelada'
    and motivo_cancelamento in ('cliente_desistiu','cliente_nao_compareceu','credito_nao_aprovado','cliente_comprou_outro','proprietario_desistiu','veiculo_indisponivel','cancelado_pela_inato','outro','anterior_a_regra')
    and ((motivo_cancelamento = 'outro' and motivo_cancelamento_detalhes is not null and btrim(motivo_cancelamento_detalhes) <> '' and length(motivo_cancelamento_detalhes) <= 500)
      or (motivo_cancelamento <> 'outro' and motivo_cancelamento_detalhes is null)))
);

drop function public.cancelar_reserva(uuid);
create function public.cancelar_reserva(p_reserva_id uuid,p_motivo text,p_motivo_detalhes text default null) returns public.reservas language plpgsql security definer set search_path='' as $$ declare u uuid;r public.reservas%rowtype;t timestamptz:=now();d text:=nullif(btrim(p_motivo_detalhes),'');begin
 u:=auth.uid();if u is null then raise exception 'Acesso não autorizado.';end if;
 if p_motivo not in('cliente_desistiu','cliente_nao_compareceu','credito_nao_aprovado','cliente_comprou_outro','proprietario_desistiu','veiculo_indisponivel','cancelado_pela_inato','outro')then raise exception 'Motivo do cancelamento inválido.';end if;
 if p_motivo='outro'and(d is null or length(d)>500)then raise exception 'Descrição do motivo inválida.';end if;if p_motivo<>'outro'then d:=null;end if;
 select * into r from public.reservas where id=p_reserva_id for update;if not found or r.status<>'ativa'then raise exception 'A reserva não pode ser cancelada.';end if;
 if not exists(select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id where up.usuario_id=u and up.empresa_id=r.empresa_id and up.unidade_id=r.unidade_id and up.ativo and p.codigo='reservas.cancelar')then raise exception 'Acesso não autorizado.';end if;
 update public.reservas set status='cancelada',motivo_cancelamento=p_motivo,motivo_cancelamento_detalhes=d,encerrado_em=t,atualizado_em=t where id=r.id and status='ativa'returning * into r;
 update public.veiculos set status='disponivel',atualizado_em=t where id=r.veiculo_id and status='reservado';return r;end;$$;
revoke execute on function public.cancelar_reserva(uuid,text,text) from public,anon;
grant execute on function public.cancelar_reserva(uuid,text,text) to authenticated;
