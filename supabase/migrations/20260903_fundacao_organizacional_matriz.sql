-- ============================================================
-- INATO CENTRAL
-- FUNDAÇÃO ORGANIZACIONAL OFICIAL
-- MATRIZ / LOJA 1 / PATROCÍNIO-MG
-- ============================================================
--
-- HIERARQUIA:
--
-- REDE INATO
--   -> OPERAÇÃO MATRIZ
--      -> ÁREA OPERACIONAL PATROCÍNIO/MG
--         -> LOJA 1 - MATRIZ INATO VEÍCULOS
--
-- PRINCÍPIOS:
--
-- PERFIL = o que o usuário pode fazer
-- ESCOPO = onde pode exercer sua autoridade
-- SETOR  = onde trabalha funcionalmente
--
-- IMPORTANTE:
-- empresa_id e unidade_id históricos NÃO são digitados
-- manualmente nesta migration.
--
-- O PostgreSQL lê os IDs já existentes no banco, valida-os
-- e os reutiliza na nova estrutura.
-- ============================================================

begin;

-- ============================================================
-- 0. PRÉ-VALIDAÇÃO DO BANCO ATUAL
-- ============================================================

do $$
declare
    v_empresas integer;
    v_unidades integer;
    v_empresa_id uuid;
    v_unidade_id uuid;
begin

    select
        count(distinct empresa_id),
        count(distinct unidade_id)
    into
        v_empresas,
        v_unidades
    from public.usuarios_perfis
    where ativo;

    if v_empresas <> 1 then
        raise exception
            'Fundação abortada: vínculos ativos possuem % empresas distintas; esperado 1.',
            v_empresas;
    end if;

    if v_unidades <> 1 then
        raise exception
            'Fundação abortada: vínculos ativos possuem % unidades distintas; esperado 1.',
            v_unidades;
    end if;

    select empresa_id
    into v_empresa_id
    from public.usuarios_perfis
    where ativo
    limit 1;

    select unidade_id
    into v_unidade_id
    from public.usuarios_perfis
    where ativo
    limit 1;

    if v_empresa_id is null then
        raise exception
            'Fundação abortada: empresa_id atual é nulo.';
    end if;

    if v_unidade_id is null then
        raise exception
            'Fundação abortada: unidade_id atual é nulo.';
    end if;

    if exists (
        select 1
        from public.oportunidades
        where empresa_id <> v_empresa_id
           or unidade_id <> v_unidade_id
    ) then
        raise exception
            'Fundação abortada: oportunidades possuem organização diferente da MATRIZ atual.';
    end if;

    if exists (
        select 1
        from public.veiculos
        where empresa_id <> v_empresa_id
           or unidade_id <> v_unidade_id
    ) then
        raise exception
            'Fundação abortada: veículos possuem organização diferente da MATRIZ atual.';
    end if;

    if exists (
        select 1
        from public.negociacoes
        where empresa_id <> v_empresa_id
           or unidade_id <> v_unidade_id
    ) then
        raise exception
            'Fundação abortada: negociações possuem organização diferente da MATRIZ atual.';
    end if;

    if exists (
        select 1
        from public.reservas
        where empresa_id <> v_empresa_id
           or unidade_id <> v_unidade_id
    ) then
        raise exception
            'Fundação abortada: reservas possuem organização diferente da MATRIZ atual.';
    end if;

end
$$;

-- ============================================================
-- 1. REDE INATO
-- ============================================================

create table public.redes (
    id uuid primary key,
    codigo text not null unique,
    nome text not null,
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

insert into public.redes (
    id,
    codigo,
    nome
)
values (
    '00000000-0000-4000-8000-000000010001',
    'inato',
    'Rede INATO'
);

-- ============================================================
-- 2. OPERAÇÃO MATRIZ
-- ============================================================

create table public.operacoes (
    id uuid primary key,

    rede_id uuid not null
        references public.redes(id),

    codigo text not null unique,
    nome text not null,

    tipo text not null
        check (
            tipo in (
                'propria',
                'franquia'
            )
        ),

    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

insert into public.operacoes (
    id,
    rede_id,
    codigo,
    nome,
    tipo
)
select distinct
    empresa_id,
    '00000000-0000-4000-8000-000000010001'::uuid,
    'matriz',
    'Operação MATRIZ',
    'propria'
from public.usuarios_perfis
where ativo;

-- ============================================================
-- 3. ÁREA OPERACIONAL PATROCÍNIO/MG
-- ============================================================

create table public.areas_operacionais (
    id uuid primary key,

    operacao_id uuid not null
        references public.operacoes(id),

    codigo text not null unique,
    nome text not null,

    cidade_referencia text not null,
    uf char(2) not null,

    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

insert into public.areas_operacionais (
    id,
    operacao_id,
    codigo,
    nome,
    cidade_referencia,
    uf
)
select distinct
    '00000000-0000-4000-8000-000000020001'::uuid,
    empresa_id,
    'patrocinio_mg',
    'Área Operacional Patrocínio/MG',
    'Patrocínio',
    'MG'
from public.usuarios_perfis
where ativo;

-- ============================================================
-- 4. LOJA 1 - MATRIZ INATO VEÍCULOS
-- ============================================================

create table public.unidades (
    id uuid primary key,

    area_operacional_id uuid not null
        references public.areas_operacionais(id),

    codigo text not null unique,

    numero integer not null
        check (numero > 0),

    nome text not null,
    nome_exibicao text not null,

    cidade text not null,
    uf char(2) not null,

    tipo text not null
        check (
            tipo in (
                'matriz',
                'filial',
                'franquia'
            )
        ),

    ativo boolean not null default true,
    criado_em timestamptz not null default now(),

    constraint unidades_numero_unique
        unique (numero)
);

insert into public.unidades (
    id,
    area_operacional_id,
    codigo,
    numero,
    nome,
    nome_exibicao,
    cidade,
    uf,
    tipo
)
select distinct
    unidade_id,
    '00000000-0000-4000-8000-000000020001'::uuid,
    'loja_1',
    1,
    'MATRIZ',
    'MATRIZ INATO VEÍCULOS',
    'Patrocínio',
    'MG',
    'matriz'
from public.usuarios_perfis
where ativo;

-- ============================================================
-- 5. SETORES DA MATRIZ
-- ============================================================

create table public.setores (
    id uuid primary key,

    unidade_id uuid not null
        references public.unidades(id),

    codigo text not null,
    nome text not null,
    descricao text null,

    ativo boolean not null default true,
    criado_em timestamptz not null default now(),

    constraint setores_unidade_codigo_unique
        unique (unidade_id, codigo)
);

insert into public.setores (
    id,
    unidade_id,
    codigo,
    nome,
    descricao
)
select
    dados.id,
    atual.unidade_id,
    dados.codigo,
    dados.nome,
    dados.descricao
from (
    select distinct unidade_id
    from public.usuarios_perfis
    where ativo
) atual
cross join (
    values
    (
        '00000000-0000-4000-8000-000000030001'::uuid,
        'direcao_gestao',
        'Direção e Gestão',
        'Direção estratégica, administração e gestão da operação'
    ),
    (
        '00000000-0000-4000-8000-000000030002'::uuid,
        'comercial',
        'Comercial',
        'Captação, atendimento, negociação e relacionamento comercial'
    ),
    (
        '00000000-0000-4000-8000-000000030003'::uuid,
        'financeiro',
        'Financeiro',
        'Recebimentos, pagamentos, controles e conciliações financeiras'
    ),
    (
        '00000000-0000-4000-8000-000000030004'::uuid,
        'operacoes_vistoria',
        'Operações e Vistoria',
        'Vistorias, conferências, preparação e processos operacionais'
    ),
    (
        '00000000-0000-4000-8000-000000030005'::uuid,
        'marketing',
        'Marketing',
        'Conteúdo, anúncios, divulgação e presença digital'
    ),
    (
        '00000000-0000-4000-8000-000000030006'::uuid,
        'relacionamento_pos_venda',
        'Relacionamento e Pós-venda',
        'Relacionamento com clientes e acompanhamento após a venda'
    ),
    (
        '00000000-0000-4000-8000-000000030007'::uuid,
        'administrativo',
        'Administrativo',
        'Rotinas administrativas e suporte interno da unidade'
    )
) as dados (
    id,
    codigo,
    nome,
    descricao
);

-- ============================================================
-- 6. NOVOS PERFIS
-- ============================================================

alter table public.perfis
    drop constraint if exists perfis_codigo_check;

alter table public.perfis
    add constraint perfis_codigo_check
    check (
        codigo in (
            'super_admin',
            'administrador',
            'gerente',
            'consultor',
            'financeiro',
            'teste'
        )
    );

insert into public.perfis (
    id,
    codigo,
    nome,
    descricao
)
values
(
    '00000000-0000-4000-8000-000000001005',
    'super_admin',
    'Super Administrador da Rede',
    'Autoridade administrativa global da Rede INATO'
),
(
    '00000000-0000-4000-8000-000000001006',
    'gerente',
    'Gerente',
    'Gestão operacional dentro do território autorizado'
);

-- ============================================================
-- 7. ESTRUTURA TERRITORIAL DOS VÍNCULOS
-- ============================================================

alter table public.usuarios_perfis
    add column rede_id uuid null
        references public.redes(id);

alter table public.usuarios_perfis
    add column operacao_id uuid null
        references public.operacoes(id);

alter table public.usuarios_perfis
    add column area_operacional_id uuid null
        references public.areas_operacionais(id);

alter table public.usuarios_perfis
    add column escopo_tipo text null;

update public.usuarios_perfis
set
    rede_id =
        '00000000-0000-4000-8000-000000010001',

    operacao_id =
        empresa_id,

    area_operacional_id =
        '00000000-0000-4000-8000-000000020001',

    escopo_tipo =
        'unidade'

where ativo;

-- ============================================================
-- 8. REGRAS DE ESCOPO
-- ============================================================

alter table public.usuarios_perfis
    alter column empresa_id drop not null;

alter table public.usuarios_perfis
    alter column escopo_tipo set not null;

alter table public.usuarios_perfis
    alter column escopo_tipo set default 'unidade';

alter table public.usuarios_perfis
    add constraint usuarios_perfis_escopo_tipo_check
    check (
        escopo_tipo in (
            'rede',
            'operacao',
            'area_operacional',
            'unidade'
        )
    );

alter table public.usuarios_perfis
    add constraint usuarios_perfis_escopo_rede_check
    check (
        escopo_tipo <> 'rede'
        or (
            perfil_id =
                '00000000-0000-4000-8000-000000001005'::uuid

            and rede_id is not null
            and operacao_id is null
            and area_operacional_id is null
            and empresa_id is null
            and unidade_id is null
        )
    );

alter table public.usuarios_perfis
    add constraint usuarios_perfis_escopo_operacao_check
    check (
        escopo_tipo <> 'operacao'
        or (
            rede_id is not null
            and operacao_id is not null
            and area_operacional_id is null
            and unidade_id is null
        )
    );

alter table public.usuarios_perfis
    add constraint usuarios_perfis_escopo_area_check
    check (
        escopo_tipo <> 'area_operacional'
        or (
            rede_id is not null
            and operacao_id is not null
            and area_operacional_id is not null
            and unidade_id is null
        )
    );

alter table public.usuarios_perfis
    add constraint usuarios_perfis_escopo_unidade_check
    check (
        escopo_tipo <> 'unidade'
        or (
            rede_id is not null
            and operacao_id is not null
            and area_operacional_id is not null
            and empresa_id is not null
            and unidade_id is not null
        )
    );

-- ============================================================
-- 9. USUÁRIOS x SETORES
-- ============================================================

create table public.usuarios_setores (
    id uuid primary key
        default gen_random_uuid(),

    usuario_id uuid not null,

    unidade_id uuid not null
        references public.unidades(id),

    setor_id uuid not null
        references public.setores(id),

    principal boolean not null default true,
    ativo boolean not null default true,

    criado_em timestamptz not null default now(),

    constraint usuarios_setores_usuario_setor_unique
        unique (usuario_id, setor_id)
);

insert into public.usuarios_setores (
    usuario_id,
    unidade_id,
    setor_id,
    principal
)
select
    up.usuario_id,
    up.unidade_id,

    case p.codigo
        when 'administrador'
            then '00000000-0000-4000-8000-000000030001'::uuid

        when 'consultor'
            then '00000000-0000-4000-8000-000000030002'::uuid

        when 'financeiro'
            then '00000000-0000-4000-8000-000000030003'::uuid
    end,

    true

from public.usuarios_perfis up

join public.perfis p
    on p.id = up.perfil_id

where up.ativo
  and p.codigo in (
      'administrador',
      'consultor',
      'financeiro'
  );

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

alter table public.redes
    enable row level security;

alter table public.operacoes
    enable row level security;

alter table public.areas_operacionais
    enable row level security;

alter table public.unidades
    enable row level security;

alter table public.setores
    enable row level security;

alter table public.usuarios_setores
    enable row level security;

-- ============================================================
-- 11. PRIVILÉGIOS
-- ============================================================

revoke all on table public.redes from anon;
revoke all on table public.operacoes from anon;
revoke all on table public.areas_operacionais from anon;
revoke all on table public.unidades from anon;
revoke all on table public.setores from anon;
revoke all on table public.usuarios_setores from anon;

revoke all on table public.redes from authenticated;
revoke all on table public.operacoes from authenticated;
revoke all on table public.areas_operacionais from authenticated;
revoke all on table public.unidades from authenticated;
revoke all on table public.setores from authenticated;
revoke all on table public.usuarios_setores from authenticated;

grant select on table public.redes to authenticated;
grant select on table public.operacoes to authenticated;
grant select on table public.areas_operacionais to authenticated;
grant select on table public.unidades to authenticated;
grant select on table public.setores to authenticated;
grant select on table public.usuarios_setores to authenticated;

-- ============================================================
-- 12. RLS - REDE
-- ============================================================

create policy redes_select_escopo_autorizado
on public.redes
for select
to authenticated
using (
    exists (
        select 1
        from public.usuarios_perfis up
        where up.usuario_id = (select auth.uid())
          and up.ativo
          and up.rede_id = redes.id
    )
);

-- ============================================================
-- 13. RLS - OPERAÇÃO
-- ============================================================

create policy operacoes_select_escopo_autorizado
on public.operacoes
for select
to authenticated
using (
    exists (
        select 1
        from public.usuarios_perfis up
        where up.usuario_id = (select auth.uid())
          and up.ativo
          and up.rede_id = operacoes.rede_id
          and (
              up.escopo_tipo = 'rede'
              or up.operacao_id = operacoes.id
          )
    )
);

-- ============================================================
-- 14. RLS - ÁREA OPERACIONAL
-- ============================================================

create policy areas_operacionais_select_escopo_autorizado
on public.areas_operacionais
for select
to authenticated
using (
    exists (
        select 1
        from public.usuarios_perfis up

        join public.operacoes op
          on op.id = areas_operacionais.operacao_id

        where up.usuario_id = (select auth.uid())
          and up.ativo
          and up.rede_id = op.rede_id

          and (
              up.escopo_tipo = 'rede'

              or (
                  up.escopo_tipo = 'operacao'
                  and up.operacao_id =
                      areas_operacionais.operacao_id
              )

              or (
                  up.escopo_tipo in (
                      'area_operacional',
                      'unidade'
                  )
                  and up.area_operacional_id =
                      areas_operacionais.id
              )
          )
    )
);

-- ============================================================
-- 15. RLS - UNIDADES
-- ============================================================

create policy unidades_select_escopo_autorizado
on public.unidades
for select
to authenticated
using (
    exists (
        select 1
        from public.usuarios_perfis up

        join public.areas_operacionais ao
          on ao.id = unidades.area_operacional_id

        join public.operacoes op
          on op.id = ao.operacao_id

        where up.usuario_id = (select auth.uid())
          and up.ativo
          and up.rede_id = op.rede_id

          and (
              up.escopo_tipo = 'rede'

              or (
                  up.escopo_tipo = 'operacao'
                  and up.operacao_id = ao.operacao_id
              )

              or (
                  up.escopo_tipo = 'area_operacional'
                  and up.area_operacional_id =
                      unidades.area_operacional_id
              )

              or (
                  up.escopo_tipo = 'unidade'
                  and up.unidade_id = unidades.id
              )
          )
    )
);

-- ============================================================
-- 16. RLS - SETORES
-- ============================================================

create policy setores_select_escopo_autorizado
on public.setores
for select
to authenticated
using (
    exists (
        select 1
        from public.usuarios_perfis up

        join public.unidades u
          on u.id = setores.unidade_id

        join public.areas_operacionais ao
          on ao.id = u.area_operacional_id

        join public.operacoes op
          on op.id = ao.operacao_id

        where up.usuario_id = (select auth.uid())
          and up.ativo
          and up.rede_id = op.rede_id

          and (
              up.escopo_tipo = 'rede'

              or (
                  up.escopo_tipo = 'operacao'
                  and up.operacao_id = ao.operacao_id
              )

              or (
                  up.escopo_tipo = 'area_operacional'
                  and up.area_operacional_id =
                      u.area_operacional_id
              )

              or (
                  up.escopo_tipo = 'unidade'
                  and up.unidade_id = u.id
              )
          )
    )
);

-- ============================================================
-- 17. RLS - USUÁRIO x SETOR
-- ============================================================

create policy usuarios_setores_select_proprio
on public.usuarios_setores
for select
to authenticated
using (
    ativo
    and usuario_id = (select auth.uid())
);

-- ============================================================
-- 18. DOCUMENTAÇÃO
-- ============================================================

comment on table public.redes is
    'Nível superior da estrutura organizacional da INATO Central.';

comment on table public.operacoes is
    'Operações próprias ou franqueadas pertencentes à Rede INATO.';

comment on table public.areas_operacionais is
    'Áreas territoriais de responsabilidade comercial da Rede INATO.';

comment on table public.unidades is
    'Lojas pertencentes às Áreas Operacionais INATO.';

comment on table public.setores is
    'Setores funcionais internos das unidades INATO.';

comment on table public.usuarios_setores is
    'Vínculos funcionais entre colaboradores e setores das unidades.';

comment on column public.usuarios_perfis.rede_id is
    'Rede alcançada pelo vínculo de autorização.';

comment on column public.usuarios_perfis.operacao_id is
    'Operação alcançada pelo vínculo de autorização.';

comment on column public.usuarios_perfis.area_operacional_id is
    'Área Operacional alcançada pelo vínculo de autorização.';

comment on column public.usuarios_perfis.escopo_tipo is
    'Nível territorial máximo da autoridade: rede, operação, área operacional ou unidade.';

-- ============================================================
-- 19. VALIDAÇÃO FINAL ANTES DO COMMIT
-- ============================================================

do $$
declare
    v_empresa_id uuid;
    v_unidade_id uuid;

    v_rede integer;
    v_operacao integer;
    v_area integer;
    v_unidade integer;
    v_setores integer;

    v_super_admin integer;
    v_gerente integer;

    v_ativos integer;
    v_classificados integer;

    v_setores_funcionais integer;

begin

    select empresa_id
    into v_empresa_id
    from public.usuarios_perfis
    where ativo
      and empresa_id is not null
    limit 1;

    select unidade_id
    into v_unidade_id
    from public.usuarios_perfis
    where ativo
      and unidade_id is not null
    limit 1;

    select count(*)
    into v_rede
    from public.redes
    where codigo = 'inato';

    select count(*)
    into v_operacao
    from public.operacoes
    where id = v_empresa_id
      and codigo = 'matriz';

    select count(*)
    into v_area
    from public.areas_operacionais
    where codigo = 'patrocinio_mg'
      and operacao_id = v_empresa_id;

    select count(*)
    into v_unidade
    from public.unidades
    where id = v_unidade_id
      and codigo = 'loja_1'
      and numero = 1;

    select count(*)
    into v_setores
    from public.setores
    where unidade_id = v_unidade_id;

    select count(*)
    into v_super_admin
    from public.perfis
    where codigo = 'super_admin';

    select count(*)
    into v_gerente
    from public.perfis
    where codigo = 'gerente';

    select count(*)
    into v_ativos
    from public.usuarios_perfis
    where ativo;

    select count(*)
    into v_classificados
    from public.usuarios_perfis
    where ativo
      and rede_id =
          '00000000-0000-4000-8000-000000010001'::uuid
      and operacao_id = empresa_id
      and area_operacional_id =
          '00000000-0000-4000-8000-000000020001'::uuid
      and escopo_tipo = 'unidade'
      and unidade_id is not null;

    select count(*)
    into v_setores_funcionais
    from public.usuarios_setores
    where ativo;

    if v_rede <> 1 then
        raise exception
            'Validação final falhou: Rede INATO.';
    end if;

    if v_operacao <> 1 then
        raise exception
            'Validação final falhou: Operação MATRIZ.';
    end if;

    if v_area <> 1 then
        raise exception
            'Validação final falhou: Área Operacional Patrocínio/MG.';
    end if;

    if v_unidade <> 1 then
        raise exception
            'Validação final falhou: Loja 1 MATRIZ.';
    end if;

    if v_setores <> 7 then
        raise exception
            'Validação final falhou: esperados 7 setores; encontrados %.',
            v_setores;
    end if;

    if v_super_admin <> 1 then
        raise exception
            'Validação final falhou: perfil SUPER ADMIN.';
    end if;

    if v_gerente <> 1 then
        raise exception
            'Validação final falhou: perfil Gerente.';
    end if;

    if v_classificados <> v_ativos then
        raise exception
            'Validação final falhou: % de % vínculos ativos foram classificados.',
            v_classificados,
            v_ativos;
    end if;

    if exists (
        select 1
        from public.usuarios_setores us
        join public.setores s
          on s.id = us.setor_id
        where us.unidade_id <> s.unidade_id
    ) then
        raise exception
            'Validação final falhou: vínculo usuário/setor pertence a unidades diferentes.';
    end if;

    if v_setores_funcionais < 1 then
        raise exception
            'Validação final falhou: nenhum colaborador funcional foi associado aos setores.';
    end if;

end
$$;

commit;