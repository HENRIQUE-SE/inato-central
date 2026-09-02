-- Saneamento incremental da tabela legada public.oportunidades.
-- Empresa e Unidade ainda não possuem tabelas-mestre persistidas; por decisão
-- arquitetural desta Sprint, os UUIDs organizacionais não recebem FKs.

begin;

do $$
begin
  if to_regclass('public.oportunidades') is null then
    raise exception 'Pré-condição inválida: public.oportunidades não existe.';
  end if;
  if to_regclass('public.auditoria_eventos') is null or to_regclass('public.veiculos') is null then
    raise exception 'Pré-condição inválida: fontes de backfill não existem.';
  end if;
  if to_regclass('public.usuarios_perfis') is null then
    raise exception 'Pré-condição inválida: public.usuarios_perfis não existe.';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'oportunidades'
      and column_name in ('empresa_id', 'unidade_id')
  ) then
    raise exception 'Pré-condição inválida: colunas organizacionais já existem em public.oportunidades.';
  end if;
end;
$$;

alter table public.oportunidades
  add column empresa_id uuid null,
  add column unidade_id uuid null;

do $$
begin
  if exists (
    select 1
    from public.oportunidades o
    join public.auditoria_eventos ae
      on ae.recurso_id = o.id::text
     and ae.modulo = 'oportunidades'
     and ae.recurso_tipo = 'oportunidade'
    group by o.id
    having count(distinct ae.empresa_id) <> 1
        or count(distinct ae.unidade_id) <> 1
        or bool_or(ae.empresa_id is null or ae.unidade_id is null)
  ) then
    raise exception 'Backfill abortado: Auditoria contém organização ausente ou ambígua para Oportunidades.';
  end if;
end;
$$;

update public.oportunidades o
set (empresa_id, unidade_id) = (
  select distinct ae.empresa_id, ae.unidade_id
  from public.auditoria_eventos ae
  where ae.recurso_id = o.id::text
    and ae.modulo = 'oportunidades'
    and ae.recurso_tipo = 'oportunidade'
)
where exists (
  select 1
  from public.auditoria_eventos ae
  where ae.recurso_id = o.id::text
    and ae.modulo = 'oportunidades'
    and ae.recurso_tipo = 'oportunidade'
);

do $$
begin
  if exists (
    select 1
    from public.oportunidades o
    join public.veiculos v on v.oportunidade_id = o.id
    where o.empresa_id is null
    group by o.id
    having count(distinct v.empresa_id) <> 1
        or count(distinct v.unidade_id) <> 1
        or bool_or(v.empresa_id is null or v.unidade_id is null)
  ) then
    raise exception 'Backfill abortado: Veículos contêm organização ausente ou ambígua para Oportunidades restantes.';
  end if;
end;
$$;

update public.oportunidades o
set (empresa_id, unidade_id) = (
  select distinct v.empresa_id, v.unidade_id
  from public.veiculos v
  where v.oportunidade_id = o.id
)
where o.empresa_id is null
  and exists (select 1 from public.veiculos v where v.oportunidade_id = o.id);

do $$
begin
  if exists (
    select 1 from public.oportunidades
    where empresa_id is null or unidade_id is null
  ) then
    raise exception 'Backfill abortado: existem Oportunidades sem organização determinável.';
  end if;
end;
$$;

alter table public.oportunidades
  alter column empresa_id set not null,
  alter column unidade_id set not null;

create index oportunidades_empresa_unidade_created_at_idx
on public.oportunidades (empresa_id, unidade_id, created_at desc);

do $$
declare
  politica record;
begin
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'oportunidades') <> 4
     or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'oportunidades' and cmd = 'SELECT' and roles = array['public']::name[] and trim(qual) = 'true') <> 1
     or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'oportunidades' and cmd = 'INSERT' and roles = array['public']::name[] and trim(with_check) = 'true') <> 1
     or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'oportunidades' and cmd = 'UPDATE' and roles = array['public']::name[] and trim(qual) = 'true' and trim(with_check) = 'true') <> 1
     or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'oportunidades' and cmd = 'DELETE' and roles = array['public']::name[] and trim(qual) = 'true') <> 1 then
    raise exception 'Pré-condição inválida: policies legadas de Oportunidades não correspondem ao estado esperado.';
  end if;
  for politica in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'oportunidades'
  loop
    execute format('drop policy %I on public.oportunidades', politica.policyname);
  end loop;
end;
$$;

create policy oportunidades_select_contexto on public.oportunidades
for select to authenticated
using (
  (select auth.uid()) is not null
  and exists (
  select 1
  from public.usuarios_perfis up
  join public.perfis pf
    on pf.id = up.perfil_id
   and pf.ativo
  join public.perfil_permissoes pp
    on pp.perfil_id = up.perfil_id
  join public.permissoes p
    on p.id = pp.permissao_id
  where up.usuario_id = (select auth.uid())
    and up.empresa_id = oportunidades.empresa_id
    and (up.unidade_id is null or up.unidade_id = oportunidades.unidade_id)
    and up.ativo
    and p.codigo = 'oportunidades.visualizar'
));

create policy oportunidades_insert_contexto on public.oportunidades
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and exists (
  select 1
  from public.usuarios_perfis up
  join public.perfis pf
    on pf.id = up.perfil_id
   and pf.ativo
  join public.perfil_permissoes pp
    on pp.perfil_id = up.perfil_id
  join public.permissoes p
    on p.id = pp.permissao_id
  where up.usuario_id = (select auth.uid())
    and up.empresa_id = oportunidades.empresa_id
    and up.unidade_id is not null
    and up.unidade_id = oportunidades.unidade_id
    and up.ativo
    and p.codigo = 'oportunidades.criar'
));

create policy oportunidades_update_contexto on public.oportunidades
for update to authenticated
using (
  (select auth.uid()) is not null
  and exists (
  select 1
  from public.usuarios_perfis up
  join public.perfis pf
    on pf.id = up.perfil_id
   and pf.ativo
  join public.perfil_permissoes pp
    on pp.perfil_id = up.perfil_id
  join public.permissoes p
    on p.id = pp.permissao_id
  where up.usuario_id = (select auth.uid())
    and up.empresa_id = oportunidades.empresa_id
    and up.unidade_id is not null
    and up.unidade_id = oportunidades.unidade_id
    and up.ativo
    and p.codigo = 'oportunidades.alterar'
))
with check (
  (select auth.uid()) is not null
  and exists (
  select 1
  from public.usuarios_perfis up
  join public.perfis pf
    on pf.id = up.perfil_id
   and pf.ativo
  join public.perfil_permissoes pp
    on pp.perfil_id = up.perfil_id
  join public.permissoes p
    on p.id = pp.permissao_id
  where up.usuario_id = (select auth.uid())
    and up.empresa_id = oportunidades.empresa_id
    and up.unidade_id is not null
    and up.unidade_id = oportunidades.unidade_id
    and up.ativo
    and p.codigo = 'oportunidades.alterar'
));

create policy oportunidades_delete_contexto on public.oportunidades
for delete to authenticated
using (
  (select auth.uid()) is not null
  and exists (
  select 1
  from public.usuarios_perfis up
  join public.perfis pf
    on pf.id = up.perfil_id
   and pf.ativo
  join public.perfil_permissoes pp
    on pp.perfil_id = up.perfil_id
  join public.permissoes p
    on p.id = pp.permissao_id
  where up.usuario_id = (select auth.uid())
    and up.empresa_id = oportunidades.empresa_id
    and up.unidade_id is not null
    and up.unidade_id = oportunidades.unidade_id
    and up.ativo
    and p.codigo = 'oportunidades.excluir'
));

revoke all on table public.oportunidades from public, anon, authenticated;
grant select, delete on table public.oportunidades to authenticated;
grant insert (
  empresa_id, unidade_id, proprietario_nome, telefone, cidade,
  veiculo_informado, placa, origem, status
) on public.oportunidades to authenticated;
grant update (
  proprietario_nome, telefone, cidade, veiculo_informado, placa, origem, status
) on public.oportunidades to authenticated;

create function public.proteger_contexto_organizacional_oportunidade()
returns trigger
language plpgsql
as $$
begin
  if old.empresa_id is distinct from new.empresa_id
     or old.unidade_id is distinct from new.unidade_id then
    raise exception 'O contexto organizacional da Oportunidade não pode ser alterado.';
  end if;
  return new;
end;
$$;

create trigger oportunidades_proteger_contexto_organizacional
before update on public.oportunidades
for each row execute function public.proteger_contexto_organizacional_oportunidade();

comment on table public.oportunidades is
  'Entidade comercial legada regularizada com isolamento organizacional. UUIDs de Empresa e Unidade permanecem sem FK até a criação futura das tabelas-mestre.';

commit;
