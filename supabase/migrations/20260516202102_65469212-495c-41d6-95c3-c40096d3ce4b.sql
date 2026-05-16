
drop policy if exists "bookings public insert" on public.bookings;
create policy "bookings open insert" on public.bookings
  for insert
  with check (end_ts > start_ts and start_ts > now() - interval '5 minutes');

revoke execute on function public.handle_new_user() from anon, authenticated, public;
