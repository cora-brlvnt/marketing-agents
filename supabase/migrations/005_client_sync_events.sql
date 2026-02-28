-- Trigger-based client sync queue + durable change log

create table if not exists public.client_sync_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  event_type text not null check (event_type in ('created','updated')),
  changed_fields jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  error text null,
  created_at timestamptz not null default now(),
  processed_at timestamptz null
);

create index if not exists idx_client_sync_events_status_created
  on public.client_sync_events(status, created_at);

create index if not exists idx_client_sync_events_client
  on public.client_sync_events(client_id, created_at desc);

create or replace function public._client_changed_fields(old_row public.clients, new_row public.clients)
returns jsonb
language plpgsql
as $$
declare
  oldj jsonb := to_jsonb(old_row);
  newj jsonb := to_jsonb(new_row);
  k text;
  out jsonb := '[]'::jsonb;
begin
  for k in select key from jsonb_object_keys(newj)
  loop
    if k in ('updated_at') then
      continue;
    end if;

    if (oldj -> k) is distinct from (newj -> k) then
      out := out || to_jsonb(k);
    end if;
  end loop;

  return out;
end;
$$;

create or replace function public.tg_enqueue_client_sync_event()
returns trigger
language plpgsql
as $$
declare
  changed jsonb := '[]'::jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.client_sync_events (client_id, event_type, changed_fields, payload)
    values (
      new.id,
      'created',
      jsonb_build_array('client_created'),
      jsonb_build_object('new', to_jsonb(new))
    );

    return new;
  end if;

  changed := public._client_changed_fields(old, new);

  -- Avoid queue noise for no-op updates
  if jsonb_array_length(changed) = 0 then
    return new;
  end if;

  -- Prevent loop from worker updates that only touch automation metadata
  if changed <@ jsonb_build_array('drive_folder_id')
     or changed <@ jsonb_build_array('visual_style') then
    return new;
  end if;

  insert into public.client_sync_events (client_id, event_type, changed_fields, payload)
  values (
    new.id,
    'updated',
    changed,
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );

  return new;
end;
$$;

drop trigger if exists trg_clients_enqueue_sync_event on public.clients;
create trigger trg_clients_enqueue_sync_event
after insert or update on public.clients
for each row execute function public.tg_enqueue_client_sync_event();
