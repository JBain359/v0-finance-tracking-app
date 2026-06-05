create or replace function execute_query(query_text text, query_params jsonb default '[]')
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  -- Extra server-side guard: only allow SELECT
  if lower(trim(query_text)) not like 'select%' then
    raise exception 'Only SELECT queries are permitted';
  end if;

  execute format('select jsonb_agg(row_to_json(t)) from (select * from (%s) t limit 500) t', query_text)
  into result;

  return coalesce(result, '[]'::jsonb);
end;
$$;