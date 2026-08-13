alter table public.permissoes drop constraint permissoes_codigo_check;
alter table public.permissoes add constraint permissoes_codigo_check check (codigo in (
  'oportunidades.visualizar','oportunidades.criar','oportunidades.alterar','oportunidades.excluir','auditoria.visualizar',
  'veiculos.preparacao.concluir','veiculos.publicacao.concluir',
  'negociacoes.visualizar','negociacoes.criar','negociacoes.alterar','negociacoes.encerrar'
));

insert into public.permissoes (id,codigo,nome) values
('00000000-0000-4000-8000-000000002008','negociacoes.visualizar','Visualizar negociações'),
('00000000-0000-4000-8000-000000002009','negociacoes.criar','Criar negociações'),
('00000000-0000-4000-8000-000000002010','negociacoes.alterar','Alterar negociações'),
('00000000-0000-4000-8000-000000002011','negociacoes.encerrar','Encerrar negociações');
insert into public.perfil_permissoes (perfil_id,permissao_id) values
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002008'),
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002009'),
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002010'),
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000002011'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002008'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002009'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002010'),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000002011'),
('00000000-0000-4000-8000-000000001004','00000000-0000-4000-8000-000000002008');

create table public.negociacoes (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null, unidade_id uuid not null,
 veiculo_id uuid not null references public.veiculos(id) on delete restrict,
 interessado_nome text not null check (btrim(interessado_nome) <> ''), interessado_telefone text not null check (btrim(interessado_telefone) <> ''),
 origem text not null check (origem in ('whatsapp','telefone','instagram','facebook','site','indicacao','presencial','outro')),
 observacoes text null, status text not null default 'em_andamento' check (status in ('em_andamento','convertida','perdida','cancelada')),
 criado_por_usuario_id uuid not null, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), encerrado_em timestamptz null,
 constraint negociacoes_encerramento_check check ((status='em_andamento' and encerrado_em is null) or (status<>'em_andamento' and encerrado_em is not null))
);
create index negociacoes_empresa_unidade_criado_idx on public.negociacoes (empresa_id,unidade_id,criado_em desc);
create index negociacoes_veiculo_idx on public.negociacoes (veiculo_id);
create index negociacoes_empresa_unidade_status_atualizado_idx on public.negociacoes (empresa_id,unidade_id,status,atualizado_em desc);

alter table public.negociacoes enable row level security;
create policy negociacoes_select_contexto on public.negociacoes for select to authenticated using (exists (
 select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id
 where up.usuario_id=(select auth.uid()) and up.empresa_id=negociacoes.empresa_id and (up.unidade_id is null or up.unidade_id=negociacoes.unidade_id) and up.ativo and p.codigo='negociacoes.visualizar'
));
create policy negociacoes_insert_contexto on public.negociacoes for insert to authenticated with check (
 status='em_andamento' and encerrado_em is null and criado_por_usuario_id=(select auth.uid()) and exists (
 select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id
 where up.usuario_id=(select auth.uid()) and up.empresa_id=negociacoes.empresa_id and up.unidade_id is not null and up.unidade_id=negociacoes.unidade_id and up.ativo and p.codigo='negociacoes.criar')
 and exists (select 1 from public.veiculos v where v.id=negociacoes.veiculo_id and v.empresa_id=negociacoes.empresa_id and v.unidade_id=negociacoes.unidade_id and v.status='disponivel' and v.arquivado_em is null)
);
create policy negociacoes_update_contexto on public.negociacoes for update to authenticated using (status='em_andamento' and exists (
 select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id
 where up.usuario_id=(select auth.uid()) and up.empresa_id=negociacoes.empresa_id and up.unidade_id is not null and up.unidade_id=negociacoes.unidade_id and up.ativo and p.codigo='negociacoes.alterar'
)) with check (status='em_andamento');

grant select on public.negociacoes to authenticated;
revoke insert on public.negociacoes from public,anon,authenticated;
grant insert (empresa_id,unidade_id,veiculo_id,interessado_nome,interessado_telefone,origem,observacoes,criado_por_usuario_id) on public.negociacoes to authenticated;
revoke update on public.negociacoes from public,anon,authenticated;
grant update (interessado_nome,interessado_telefone,origem,observacoes,atualizado_em) on public.negociacoes to authenticated;

create function public.proteger_campos_estruturais_negociacao() returns trigger language plpgsql as $$ begin
 if old.id is distinct from new.id or old.empresa_id is distinct from new.empresa_id or old.unidade_id is distinct from new.unidade_id or old.veiculo_id is distinct from new.veiculo_id or old.criado_por_usuario_id is distinct from new.criado_por_usuario_id or old.criado_em is distinct from new.criado_em then raise exception 'Campos estruturais da negociação não podem ser alterados.'; end if;
 if old.status is distinct from new.status and not (old.status='em_andamento' and new.status in ('convertida','perdida','cancelada') and new.encerrado_em is not null) then raise exception 'Transição de status da negociação não permitida.'; end if;
 if old.status is not distinct from new.status and old.encerrado_em is distinct from new.encerrado_em then raise exception 'Encerramento da negociação não pode ser alterado diretamente.'; end if;
 return new; end; $$;
create trigger negociacoes_proteger_estrutura before update on public.negociacoes for each row execute function public.proteger_campos_estruturais_negociacao();

create function public.marcar_negociacao_convertida(p_negociacao_id uuid) returns public.negociacoes language plpgsql security definer set search_path='' as $$ declare v_usuario uuid; v_negociacao public.negociacoes%rowtype; begin
 v_usuario:=auth.uid(); if v_usuario is null then raise exception 'Acesso não autorizado.'; end if;
 select n.* into v_negociacao from public.negociacoes n where n.id=p_negociacao_id and exists (
 select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id
 where up.usuario_id=v_usuario and up.empresa_id=n.empresa_id and up.unidade_id is not null and up.unidade_id=n.unidade_id and up.ativo and p.codigo='negociacoes.encerrar') for update;
 if not found or v_negociacao.status<>'em_andamento' then raise exception 'Negociação não pode ser encerrada.'; end if;
 update public.negociacoes set status='convertida',encerrado_em=now(),atualizado_em=now() where id=p_negociacao_id and status='em_andamento' returning * into v_negociacao;
 if not found then raise exception 'Negociação não pode ser encerrada.'; end if; return v_negociacao; end; $$;

create function public.marcar_negociacao_perdida(p_negociacao_id uuid) returns public.negociacoes language plpgsql security definer set search_path='' as $$ declare v_usuario uuid; v_negociacao public.negociacoes%rowtype; begin
 v_usuario:=auth.uid(); if v_usuario is null then raise exception 'Acesso não autorizado.'; end if;
 select n.* into v_negociacao from public.negociacoes n where n.id=p_negociacao_id and exists (
 select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id
 where up.usuario_id=v_usuario and up.empresa_id=n.empresa_id and up.unidade_id is not null and up.unidade_id=n.unidade_id and up.ativo and p.codigo='negociacoes.encerrar') for update;
 if not found or v_negociacao.status<>'em_andamento' then raise exception 'Negociação não pode ser encerrada.'; end if;
 update public.negociacoes set status='perdida',encerrado_em=now(),atualizado_em=now() where id=p_negociacao_id and status='em_andamento' returning * into v_negociacao;
 if not found then raise exception 'Negociação não pode ser encerrada.'; end if; return v_negociacao; end; $$;

create function public.cancelar_negociacao(p_negociacao_id uuid) returns public.negociacoes language plpgsql security definer set search_path='' as $$ declare v_usuario uuid; v_negociacao public.negociacoes%rowtype; begin
 v_usuario:=auth.uid(); if v_usuario is null then raise exception 'Acesso não autorizado.'; end if;
 select n.* into v_negociacao from public.negociacoes n where n.id=p_negociacao_id and exists (
 select 1 from public.usuarios_perfis up join public.perfil_permissoes pp on pp.perfil_id=up.perfil_id join public.permissoes p on p.id=pp.permissao_id
 where up.usuario_id=v_usuario and up.empresa_id=n.empresa_id and up.unidade_id is not null and up.unidade_id=n.unidade_id and up.ativo and p.codigo='negociacoes.encerrar') for update;
 if not found or v_negociacao.status<>'em_andamento' then raise exception 'Negociação não pode ser encerrada.'; end if;
 update public.negociacoes set status='cancelada',encerrado_em=now(),atualizado_em=now() where id=p_negociacao_id and status='em_andamento' returning * into v_negociacao;
 if not found then raise exception 'Negociação não pode ser encerrada.'; end if; return v_negociacao; end; $$;

revoke execute on function public.marcar_negociacao_convertida(uuid) from public,anon;
revoke execute on function public.marcar_negociacao_perdida(uuid) from public,anon;
revoke execute on function public.cancelar_negociacao(uuid) from public,anon;
grant execute on function public.marcar_negociacao_convertida(uuid) to authenticated;
grant execute on function public.marcar_negociacao_perdida(uuid) to authenticated;
grant execute on function public.cancelar_negociacao(uuid) to authenticated;
