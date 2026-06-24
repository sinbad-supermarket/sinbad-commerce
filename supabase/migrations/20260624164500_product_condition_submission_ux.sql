alter table public.products
  add column if not exists product_condition text not null default 'new';

alter table public.products
  drop constraint if exists products_product_condition_check;

alter table public.products
  add constraint products_product_condition_check
    check (product_condition in ('new', 'refurbished', 'used'));

create or replace function public.apply_approved_submission_product_condition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  submitted_condition text;
begin
  if new.status <> 'approved'
    or coalesce(old.status, '') = 'approved'
    or new.product_id is null then
    return new;
  end if;

  submitted_condition := coalesce(new.snapshot->'product'->>'product_condition', 'new');

  if submitted_condition not in ('new', 'refurbished', 'used') then
    raise exception 'Product condition is invalid.';
  end if;

  update public.products
  set product_condition = submitted_condition
  where id = new.product_id
    and vendor_id = new.vendor_id;

  return new;
end;
$$;

drop trigger if exists apply_approved_submission_product_condition
on public.product_review_submissions;

create trigger apply_approved_submission_product_condition
after update of status on public.product_review_submissions
for each row
when (new.status = 'approved')
execute function public.apply_approved_submission_product_condition();

revoke all on function public.apply_approved_submission_product_condition() from public;
