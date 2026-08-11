alter table public.permissoes
  drop constraint permissoes_codigo_check;

alter table public.permissoes
  add constraint permissoes_codigo_check check (
    codigo in (
      'oportunidades.visualizar',
      'oportunidades.criar',
      'oportunidades.alterar',
      'oportunidades.excluir',
      'auditoria.visualizar',
      'veiculos.preparacao.concluir'
    )
  );

insert into public.permissoes (id, codigo, nome)
values (
  '00000000-0000-4000-8000-000000002006',
  'veiculos.preparacao.concluir',
  'Concluir preparação de veículo'
);

insert into public.perfil_permissoes (perfil_id, permissao_id) values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000002006'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000002006');

alter table public.veiculos
  drop constraint veiculos_status_check;

alter table public.veiculos
  add constraint veiculos_status_check check (
    status in (
      'em_preparacao',
      'pronto_para_anunciar',
      'disponivel',
      'reservado',
      'vendido',
      'cancelado'
    )
  );

revoke update on table public.veiculos from public, anon, authenticated;
revoke update (status) on table public.veiculos from public, anon, authenticated;

grant update (
  proprietario_nome,
  placa,
  marca,
  modelo,
  versao,
  ano_fabricacao,
  ano_modelo,
  cor,
  quilometragem,
  renavam,
  chassi,
  codigo_fipe,
  atualizado_em
) on table public.veiculos to authenticated;

create or replace function public.proteger_campos_estruturais_veiculo()
returns trigger
language plpgsql
as $$
begin
  if old.id is distinct from new.id
    or old.empresa_id is distinct from new.empresa_id
    or old.unidade_id is distinct from new.unidade_id
    or old.oportunidade_id is distinct from new.oportunidade_id
    or old.criado_em is distinct from new.criado_em
    or old.arquivado_em is distinct from new.arquivado_em
  then
    raise exception 'Campos estruturais do veículo não podem ser alterados.';
  end if;

  if old.status is distinct from new.status
    and not (
      old.status = 'em_preparacao'
      and new.status = 'pronto_para_anunciar'
    )
  then
    raise exception 'Transição de status do veículo não permitida.';
  end if;

  return new;
end;
$$;

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
      and exists (
        select 1
        from public.usuarios_perfis up
        join public.perfil_permissoes pp
          on pp.perfil_id = up.perfil_id
        join public.permissoes p
          on p.id = pp.permissao_id
        where up.usuario_id = v_usuario_id
          and up.empresa_id = v.empresa_id
          and up.unidade_id is not null
          and up.unidade_id = v.unidade_id
          and up.ativo
          and p.codigo = 'veiculos.preparacao.concluir'
      )
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

revoke execute on function public.marcar_veiculo_pronto_para_anunciar(uuid)
  from public, anon;

grant execute on function public.marcar_veiculo_pronto_para_anunciar(uuid)
  to authenticated;
