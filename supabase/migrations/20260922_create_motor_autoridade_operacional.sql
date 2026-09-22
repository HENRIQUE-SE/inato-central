begin;

create function public.usuario_tem_acesso_territorial(
    unidade_alvo uuid,
    empresa_alvo uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    with vinculos_ativos as (
        select
            up.*,
            count(*) over () as quantidade_vinculos_ativos
        from public.usuarios_perfis up
        where up.usuario_id = (select auth.uid())
          and up.ativo
    ),
    vinculo_unico as (
        select va.*
        from vinculos_ativos va
        join public.perfis pf
          on pf.id = va.perfil_id
         and pf.ativo
        where va.quantidade_vinculos_ativos = 1
    )
    select coalesce((
        select case vu.escopo_tipo
            when 'rede' then
                vu.rede_id is not null
                and vu.operacao_id is null
                and vu.area_operacional_id is null
                and vu.empresa_id is null
                and vu.unidade_id is null
                and vu.rede_id = op.rede_id
            when 'operacao' then
                vu.rede_id is not null
                and vu.operacao_id is not null
                and vu.area_operacional_id is null
                and vu.unidade_id is null
                and vu.rede_id = op.rede_id
                and vu.operacao_id = op.id
            when 'area_operacional' then
                vu.rede_id is not null
                and vu.operacao_id is not null
                and vu.area_operacional_id is not null
                and vu.unidade_id is null
                and vu.rede_id = op.rede_id
                and vu.operacao_id = op.id
                and vu.area_operacional_id = ao.id
            when 'unidade' then
                vu.rede_id is not null
                and vu.operacao_id is not null
                and vu.area_operacional_id is not null
                and vu.empresa_id is not null
                and vu.unidade_id is not null
                and vu.rede_id = op.rede_id
                and vu.operacao_id = op.id
                and vu.area_operacional_id = ao.id
                and vu.unidade_id = u.id
                and vu.empresa_id = op.empresa_id
            else false
        end
        from vinculo_unico vu
        join public.unidades u
          on u.id = unidade_alvo
         and u.ativo
        join public.areas_operacionais ao
          on ao.id = u.area_operacional_id
         and ao.ativo
        join public.operacoes op
          on op.id = ao.operacao_id
         and op.ativo
         and op.empresa_id is not null
        join public.redes r
          on r.id = op.rede_id
         and r.ativo
        where (select auth.uid()) is not null
          and unidade_alvo is not null
          and empresa_alvo is not null
          and op.empresa_id = empresa_alvo
    ), false);
$$;

comment on function public.usuario_tem_acesso_territorial(uuid, uuid) is
    'Valida somente ONDE o usuário autenticado pode operar, usando vínculo ativo único e hierarquia persistida.';

create function public.usuario_tem_permissao(
    permissao_codigo text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    with vinculos_ativos as (
        select
            up.*,
            count(*) over () as quantidade_vinculos_ativos
        from public.usuarios_perfis up
        where up.usuario_id = (select auth.uid())
          and up.ativo
    ),
    vinculo_unico as (
        select va.*
        from vinculos_ativos va
        join public.perfis pf
          on pf.id = va.perfil_id
         and pf.ativo
        where va.quantidade_vinculos_ativos = 1
    )
    select coalesce(
        (select auth.uid()) is not null
        and permissao_codigo is not null
        and btrim(permissao_codigo) <> ''
        and exists (
            select 1
            from vinculo_unico vu
            join public.perfil_permissoes pp
              on pp.perfil_id = vu.perfil_id
            join public.permissoes p
              on p.id = pp.permissao_id
             and p.codigo = permissao_codigo
        ),
        false
    );
$$;

comment on function public.usuario_tem_permissao(text) is
    'Valida somente O QUE o usuário autenticado pode fazer. Policies e RPCs devem fornecer códigos constantes, nunca parâmetros livres recebidos da interface.';

revoke all on function public.usuario_tem_acesso_territorial(uuid, uuid)
    from PUBLIC;

revoke all on function public.usuario_tem_acesso_territorial(uuid, uuid)
    from anon;

revoke all on function public.usuario_tem_permissao(text)
    from PUBLIC;

revoke all on function public.usuario_tem_permissao(text)
    from anon;

grant execute on function public.usuario_tem_acesso_territorial(uuid, uuid)
    to authenticated;

grant execute on function public.usuario_tem_permissao(text)
    to authenticated;

commit;
