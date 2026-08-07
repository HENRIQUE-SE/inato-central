create table public.auditoria_eventos (
  id uuid primary key,
  empresa_id uuid not null,
  unidade_id uuid null,
  usuario_id uuid not null,
  modulo text not null,
  acao text not null constraint auditoria_eventos_acao_check
    check (acao in ('criar', 'alterar', 'excluir', 'visualizar', 'entrar', 'sair')),
  recurso_tipo text not null,
  recurso_id text null,
  resultado text not null constraint auditoria_eventos_resultado_check
    check (resultado in ('sucesso', 'falha')),
  origem text not null constraint auditoria_eventos_origem_check
    check (origem in ('sistema', 'usuario', 'integracao')),
  detalhes jsonb null,
  criado_em timestamptz not null default now()
);

create index auditoria_eventos_criado_em_idx on public.auditoria_eventos (criado_em desc);
create index auditoria_eventos_empresa_id_idx on public.auditoria_eventos (empresa_id);
create index auditoria_eventos_unidade_id_idx on public.auditoria_eventos (unidade_id);
create index auditoria_eventos_usuario_id_idx on public.auditoria_eventos (usuario_id);
create index auditoria_eventos_modulo_idx on public.auditoria_eventos (modulo);
create index auditoria_eventos_acao_idx on public.auditoria_eventos (acao);
create index auditoria_eventos_resultado_idx on public.auditoria_eventos (resultado);

alter table public.auditoria_eventos enable row level security;

create policy auditoria_eventos_insert_authenticated
on public.auditoria_eventos for insert to authenticated
with check (
  (select auth.uid()) is not null
  and usuario_id = (select auth.uid())
  and empresa_id = '00000000-0000-4000-8000-000000000001'::uuid
);

create policy auditoria_eventos_select_authenticated
on public.auditoria_eventos for select to authenticated
using (
  (select auth.uid()) is not null
  and empresa_id = '00000000-0000-4000-8000-000000000001'::uuid
);

comment on table public.auditoria_eventos is
  'Histórico imutável. RLS transitória para empresa única; substituir por vínculo organizacional persistido na evolução multiempresa.';

comment on policy auditoria_eventos_insert_authenticated on public.auditoria_eventos is
  'Transitória: authenticated insere apenas evento próprio na empresa INATO atual.';
comment on policy auditoria_eventos_select_authenticated on public.auditoria_eventos is
  'Transitória: authenticated consulta a empresa INATO atual; substituir por autorização organizacional.';
