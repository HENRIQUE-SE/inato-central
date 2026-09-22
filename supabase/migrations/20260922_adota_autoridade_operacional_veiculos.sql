begin;

drop policy veiculos_select_contexto on public.veiculos;
drop policy veiculos_insert_contexto on public.veiculos;
drop policy veiculos_update_contexto on public.veiculos;

create policy veiculos_select_contexto on public.veiculos
for select to authenticated
using (
  public.usuario_tem_acesso_territorial(
    veiculos.unidade_id,
    veiculos.empresa_id
  )
);

create policy veiculos_insert_contexto on public.veiculos
for insert to authenticated
with check (
  public.usuario_tem_acesso_territorial(
    veiculos.unidade_id,
    veiculos.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.criar')
  and exists (
    select 1
    from public.oportunidades o
    where o.id = veiculos.oportunidade_id
  )
);

create policy veiculos_update_contexto on public.veiculos
for update to authenticated
using (
  veiculos.arquivado_em is null
  and public.usuario_tem_acesso_territorial(
    veiculos.unidade_id,
    veiculos.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.alterar')
)
with check (
  veiculos.arquivado_em is null
  and public.usuario_tem_acesso_territorial(
    veiculos.unidade_id,
    veiculos.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.alterar')
);

create or replace function public.marcar_veiculo_pronto_para_anunciar(
  p_veiculo_id uuid
)
returns public.veiculos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_veiculo public.veiculos%rowtype;
begin
  v_usuario_id := auth.uid();

  if v_usuario_id is null then
    raise exception 'Acesso não autorizado.';
  end if;

  select v.*
    into v_veiculo
    from public.veiculos v
    where v.id = p_veiculo_id
      and public.usuario_tem_acesso_territorial(
        v.unidade_id,
        v.empresa_id
      )
      and public.usuario_tem_permissao('veiculos.preparacao.concluir')
    for update;

  if not found then
    raise exception 'Acesso não autorizado ou veículo não encontrado.';
  end if;

  if v_veiculo.arquivado_em is not null
    or v_veiculo.status <> 'em_preparacao'
  then
    raise exception 'O veículo não pode ser marcado como pronto para anunciar.';
  end if;

  update public.veiculos v
    set status = 'pronto_para_anunciar',
        atualizado_em = now()
    where v.id = p_veiculo_id
      and v.status = 'em_preparacao'
      and v.arquivado_em is null
    returning v.* into v_veiculo;

  if not found then
    raise exception 'O veículo não pode ser marcado como pronto para anunciar.';
  end if;

  return v_veiculo;
end;
$$;

create or replace function public.marcar_veiculo_disponivel(
  p_veiculo_id uuid
)
returns public.veiculos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_veiculo public.veiculos%rowtype;
begin
  v_usuario_id := auth.uid();

  if v_usuario_id is null then
    raise exception 'Acesso não autorizado.';
  end if;

  select v.*
    into v_veiculo
    from public.veiculos v
    where v.id = p_veiculo_id
      and public.usuario_tem_acesso_territorial(
        v.unidade_id,
        v.empresa_id
      )
      and public.usuario_tem_permissao('veiculos.publicacao.concluir')
    for update;

  if not found then
    raise exception 'Acesso não autorizado ou veículo não encontrado.';
  end if;

  if v_veiculo.arquivado_em is not null
    or v_veiculo.status <> 'pronto_para_anunciar'
  then
    raise exception 'O veículo não pode ser marcado como disponível.';
  end if;

  update public.veiculos v
    set status = 'disponivel',
        atualizado_em = now()
    where v.id = p_veiculo_id
      and v.status = 'pronto_para_anunciar'
      and v.arquivado_em is null
    returning v.* into v_veiculo;

  if not found then
    raise exception 'O veículo não pode ser marcado como disponível.';
  end if;

  return v_veiculo;
end;
$$;

commit;
