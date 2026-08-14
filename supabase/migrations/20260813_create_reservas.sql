alter table public.permissoes drop constraint permissoes_codigo_check;
alter table public.permissoes add constraint permissoes_codigo_check check (codigo in (
  'oportunidades.visualizar','oportunidades.criar','oportunidades.alterar','oportunidades.excluir','auditoria.visualizar',
  'veiculos.preparacao.concluir','veiculos.publicacao.concluir','negociacoes.visualizar','negociacoes.criar','negociacoes.alterar','negociacoes.encerrar',
  'reservas.visualizar','reservas.criar','reservas.cancelar'
));
insert into public.permissoes(id,codigo,nome) values
('00000000-0000-4000-8000-000000002012','reservas.visualizar','Visualizar reservas'),
('00000000-0000-4000-8000-000000002013','reservas.criar','Criar reservas'),
('00000000-0000-4000-8000-000000002014','reservas.cancelar','Cancelar reservas');
insert into public.perfil_permissoes(perfil_id,permissao_id) values
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002012'),
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002013'),
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002014'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002012'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002013'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002014'),
('00000000-0000-4000-8000-000000001004','00000000-0000-4000-8000-000000002012');

create table public.reservas(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null, unidade_id uuid not null,
 negociacao_id uuid not null references public.negociacoes(id) on delete restrict,
 veiculo_id uuid not null references public.veiculos(id) on delete restrict,
 status text not null default 'ativa' check(status in('ativa','expirada','cancelada')),
 criado_por_usuario_id uuid not null, reservado_em timestamptz not null default now(),
 expira_em timestamptz not null default(now()+interval '24 hours'), atualizado_em timestamptz not null default now(), encerrado_em timestamptz null,
 constraint reservas_duracao_check check(expira_em=reservado_em+interval '24 hours'),
 constraint reservas_encerramento_check check((status='ativa' and encerrado_em is null)or(status<>'ativa' and encerrado_em is not null))
);
create unique index reservas_veiculo_ativa_unique on public.reservas(veiculo_id) where status='ativa';
create index reservas_contexto_criado_idx on public.reservas(empresa_id,unidade_id,reservado_em desc);
create index reservas_negociacao_idx on public.reservas(negociacao_id);
alter table public.reservas enable row level security;
create policy reservas_select_contexto on public.reservas for select to authenticated using(exists(select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id where up.usuario_id=(select auth.uid()) and up.empresa_id=reservas.empresa_id and(up.unidade_id is null or up.unidade_id=reservas.unidade_id)and up.ativo and p.codigo='reservas.visualizar'));
grant select on public.reservas to authenticated;
revoke insert,update,delete on public.reservas from public,anon,authenticated;

create or replace function public.proteger_campos_estruturais_veiculo() returns trigger language plpgsql as $$ begin
 if old.id is distinct from new.id or old.empresa_id is distinct from new.empresa_id or old.unidade_id is distinct from new.unidade_id or old.oportunidade_id is distinct from new.oportunidade_id or old.criado_em is distinct from new.criado_em or old.arquivado_em is distinct from new.arquivado_em then raise exception 'Campos estruturais do veículo não podem ser alterados.'; end if;
 if old.status is distinct from new.status and not((old.status='em_preparacao'and new.status='pronto_para_anunciar')or(old.status='pronto_para_anunciar'and new.status='disponivel')or(old.status='disponivel'and new.status='reservado')or(old.status='reservado'and new.status='disponivel'))then raise exception 'Transição de status do veículo não permitida.';end if;return new;end;$$;

create function public.criar_reserva(p_negociacao_id uuid) returns public.reservas language plpgsql security definer set search_path='' as $$ declare u uuid; n public.negociacoes%rowtype;v public.veiculos%rowtype;r public.reservas%rowtype;t timestamptz:=now();begin
 u:=auth.uid();if u is null then raise exception 'Acesso não autorizado.';end if;
 select * into n from public.negociacoes where id=p_negociacao_id for update;if not found then raise exception 'Negociação não encontrada.';end if;
 if n.status<>'em_andamento' then raise exception 'A negociação não pode ser reservada.';end if;
 if not exists(select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id where up.usuario_id=u and up.empresa_id=n.empresa_id and up.unidade_id=n.unidade_id and up.ativo and p.codigo='reservas.criar')then raise exception 'Acesso não autorizado.';end if;
 select * into v from public.veiculos where id=n.veiculo_id for update;if not found or v.empresa_id<>n.empresa_id or v.unidade_id<>n.unidade_id or v.arquivado_em is not null or v.status<>'disponivel'then raise exception 'O veículo não pode ser reservado.';end if;
 insert into public.reservas(empresa_id,unidade_id,negociacao_id,veiculo_id,criado_por_usuario_id,reservado_em,expira_em,atualizado_em)values(n.empresa_id,n.unidade_id,n.id,v.id,u,t,t+interval '24 hours',t)returning * into r;
 update public.veiculos set status='reservado',atualizado_em=t where id=v.id and status='disponivel'and arquivado_em is null;if not found then raise exception 'O veículo não pode ser reservado.';end if;return r;end;$$;
create function public.cancelar_reserva(p_reserva_id uuid) returns public.reservas language plpgsql security definer set search_path='' as $$ declare u uuid;r public.reservas%rowtype;t timestamptz:=now();begin u:=auth.uid();if u is null then raise exception 'Acesso não autorizado.';end if;select * into r from public.reservas where id=p_reserva_id for update;if not found or r.status<>'ativa'then raise exception 'A reserva não pode ser cancelada.';end if;if not exists(select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id where up.usuario_id=u and up.empresa_id=r.empresa_id and up.unidade_id=r.unidade_id and up.ativo and p.codigo='reservas.cancelar')then raise exception 'Acesso não autorizado.';end if;update public.reservas set status='cancelada',encerrado_em=t,atualizado_em=t where id=r.id and status='ativa'returning * into r;update public.veiculos set status='disponivel',atualizado_em=t where id=r.veiculo_id and status='reservado';return r;end;$$;
create function public.expirar_reservas_vencidas() returns integer language plpgsql security definer set search_path='' as $$ declare r public.reservas%rowtype;q integer:=0;t timestamptz:=now();begin if auth.uid() is null then raise exception 'Acesso não autorizado.';end if;for r in select x.* from public.reservas x where x.status='ativa'and x.expira_em<=t and exists(select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id where up.usuario_id=auth.uid()and up.empresa_id=x.empresa_id and(up.unidade_id is null or up.unidade_id=x.unidade_id)and up.ativo and p.codigo='reservas.visualizar')for update skip locked loop update public.reservas set status='expirada',encerrado_em=t,atualizado_em=t where id=r.id and status='ativa';if found then update public.veiculos set status='disponivel',atualizado_em=t where id=r.veiculo_id and status='reservado';insert into public.auditoria_eventos(id,empresa_id,unidade_id,usuario_id,modulo,acao,recurso_tipo,recurso_id,resultado,origem,detalhes)values(gen_random_uuid(),r.empresa_id,r.unidade_id,auth.uid(),'reservas','alterar','reserva',r.id::text,'sucesso','sistema',jsonb_build_object('autoria','sistema','motivo','expiracao_24_horas','statusAnterior','ativa','statusNovo','expirada','expiraEm',r.expira_em));q:=q+1;end if;end loop;return q;end;$$;
revoke execute on function public.criar_reserva(uuid),public.cancelar_reserva(uuid),public.expirar_reservas_vencidas() from public,anon;
grant execute on function public.criar_reserva(uuid),public.cancelar_reserva(uuid),public.expirar_reservas_vencidas() to authenticated;
