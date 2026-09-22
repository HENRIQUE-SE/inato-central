begin;

drop policy oportunidades_select_contexto on public.oportunidades;
drop policy oportunidades_insert_contexto on public.oportunidades;
drop policy oportunidades_update_contexto on public.oportunidades;
drop policy oportunidades_delete_contexto on public.oportunidades;

create policy oportunidades_select_contexto on public.oportunidades
for select to authenticated
using (
  public.usuario_tem_acesso_territorial(
    oportunidades.unidade_id,
    oportunidades.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.visualizar')
);

create policy oportunidades_insert_contexto on public.oportunidades
for insert to authenticated
with check (
  public.usuario_tem_acesso_territorial(
    oportunidades.unidade_id,
    oportunidades.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.criar')
);

create policy oportunidades_update_contexto on public.oportunidades
for update to authenticated
using (
  public.usuario_tem_acesso_territorial(
    oportunidades.unidade_id,
    oportunidades.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.alterar')
)
with check (
  public.usuario_tem_acesso_territorial(
    oportunidades.unidade_id,
    oportunidades.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.alterar')
);

create policy oportunidades_delete_contexto on public.oportunidades
for delete to authenticated
using (
  public.usuario_tem_acesso_territorial(
    oportunidades.unidade_id,
    oportunidades.empresa_id
  )
  and public.usuario_tem_permissao('oportunidades.excluir')
);

commit;
