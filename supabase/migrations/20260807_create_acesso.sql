create table public.perfis (
  id uuid primary key,
  codigo text unique not null check (codigo in ('administrador', 'consultor', 'financeiro', 'teste')),
  nome text not null,
  descricao text null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.permissoes (
  id uuid primary key,
  codigo text unique not null check (codigo in ('oportunidades.visualizar', 'oportunidades.criar', 'oportunidades.alterar', 'oportunidades.excluir', 'auditoria.visualizar')),
  nome text not null,
  descricao text null,
  criado_em timestamptz not null default now()
);

create table public.perfil_permissoes (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  permissao_id uuid not null references public.permissoes(id) on delete cascade,
  primary key (perfil_id, permissao_id)
);

create table public.usuarios_perfis (
  id uuid primary key,
  usuario_id uuid not null,
  empresa_id uuid not null,
  unidade_id uuid null,
  perfil_id uuid not null references public.perfis(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create unique index usuarios_perfis_ativo_unidade_unique
on public.usuarios_perfis (usuario_id, empresa_id, unidade_id)
where ativo and unidade_id is not null;

create unique index usuarios_perfis_ativo_empresa_unique
on public.usuarios_perfis (usuario_id, empresa_id)
where ativo and unidade_id is null;

insert into public.perfis (id, codigo, nome, descricao) values
  ('00000000-0000-4000-8000-000000001001', 'administrador', 'Administrador', 'Acesso administrativo inicial'),
  ('00000000-0000-4000-8000-000000001002', 'consultor', 'Consultor', 'Operação de oportunidades'),
  ('00000000-0000-4000-8000-000000001003', 'financeiro', 'Financeiro', 'Perfil financeiro inicial'),
  ('00000000-0000-4000-8000-000000001004', 'teste', 'Teste', 'Perfil restrito para validação');

insert into public.permissoes (id, codigo, nome) values
  ('00000000-0000-4000-8000-000000002001', 'oportunidades.visualizar', 'Visualizar oportunidades'),
  ('00000000-0000-4000-8000-000000002002', 'oportunidades.criar', 'Criar oportunidades'),
  ('00000000-0000-4000-8000-000000002003', 'oportunidades.alterar', 'Alterar oportunidades'),
  ('00000000-0000-4000-8000-000000002004', 'oportunidades.excluir', 'Excluir oportunidades'),
  ('00000000-0000-4000-8000-000000002005', 'auditoria.visualizar', 'Visualizar auditoria');

insert into public.perfil_permissoes (perfil_id, permissao_id) values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000002001'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000002002'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000002003'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000002004'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000002005'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000002001'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000002002'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000002003'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000002004'),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000002001');

alter table public.perfis enable row level security;
alter table public.permissoes enable row level security;
alter table public.perfil_permissoes enable row level security;
alter table public.usuarios_perfis enable row level security;

create policy usuarios_perfis_select_proprio on public.usuarios_perfis
for select to authenticated
using (ativo and usuario_id = (select auth.uid()));

create policy perfis_select_associado on public.perfis
for select to authenticated
using (ativo and exists (
  select 1 from public.usuarios_perfis up
  where up.perfil_id = perfis.id and up.usuario_id = (select auth.uid()) and up.ativo
));

create policy perfil_permissoes_select_associado on public.perfil_permissoes
for select to authenticated
using (exists (
  select 1 from public.usuarios_perfis up
  where up.perfil_id = perfil_permissoes.perfil_id and up.usuario_id = (select auth.uid()) and up.ativo
));

create policy permissoes_select_associadas on public.permissoes
for select to authenticated
using (exists (
  select 1 from public.perfil_permissoes pp
  join public.usuarios_perfis up on up.perfil_id = pp.perfil_id
  where pp.permissao_id = permissoes.id and up.usuario_id = (select auth.uid()) and up.ativo
));

comment on table public.usuarios_perfis is
  'Vínculo transitório de acesso. A administração e o isolamento multiempresa serão ampliados em Sprint futura.';
