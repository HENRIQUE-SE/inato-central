create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  unidade_id uuid not null,
  oportunidade_id uuid not null,
  constraint veiculos_oportunidade_fk
    foreign key (oportunidade_id)
    references public.oportunidades(id)
    on delete restrict,
  proprietario_nome text not null,
  placa text not null check (btrim(placa) <> ''),
  renavam text null,
  chassi text null,
  marca text not null,
  modelo text not null,
  versao text null,
  ano_fabricacao integer not null check (ano_fabricacao between 1886 and 2100),
  ano_modelo integer not null check (
    ano_modelo between 1886 and 2100
    and ano_modelo between ano_fabricacao and ano_fabricacao + 1
  ),
  cor text not null,
  quilometragem integer not null check (quilometragem >= 0),
  codigo_fipe text null,
  status text not null default 'em_preparacao' check (
    status in ('em_preparacao', 'disponivel', 'reservado', 'vendido', 'cancelado')
  ),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  arquivado_em timestamptz null
);

create unique index veiculos_empresa_placa_nao_arquivado_unique
on public.veiculos (empresa_id, upper(placa))
where arquivado_em is null;

create unique index veiculos_empresa_renavam_nao_arquivado_unique
on public.veiculos (empresa_id, renavam)
where renavam is not null and arquivado_em is null;

create unique index veiculos_empresa_chassi_nao_arquivado_unique
on public.veiculos (empresa_id, upper(chassi))
where chassi is not null and arquivado_em is null;

create index veiculos_empresa_unidade_criado_em_idx
on public.veiculos (empresa_id, unidade_id, criado_em desc)
where arquivado_em is null;

create index veiculos_oportunidade_id_idx
on public.veiculos (oportunidade_id);

alter table public.veiculos enable row level security;

create policy veiculos_select_contexto on public.veiculos
for select to authenticated
using (exists (
  select 1
  from public.usuarios_perfis up
  where up.usuario_id = (select auth.uid())
    and up.empresa_id = veiculos.empresa_id
    and (up.unidade_id is null or up.unidade_id = veiculos.unidade_id)
    and up.ativo
));

comment on table public.veiculos is
  'Cadastro automotivo oficial da Plataforma INATO, isolado por empresa e unidade.';
