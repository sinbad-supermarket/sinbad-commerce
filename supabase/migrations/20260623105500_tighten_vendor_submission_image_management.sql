create or replace function public.can_manage_vendor_submission_image_object(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  path_parts text[];
  parsed_vendor_id uuid;
  parsed_submission_id uuid;
begin
  if p_path !~ '^vendor-submissions/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    return false;
  end if;

  path_parts := string_to_array(p_path, '/');
  parsed_vendor_id := path_parts[2]::uuid;
  parsed_submission_id := path_parts[3]::uuid;

  return public.is_active_vendor_member(parsed_vendor_id)
    and exists (
      select 1
      from public.vendors v
      join public.product_review_submissions prs
        on prs.vendor_id = v.id
      where v.id = parsed_vendor_id
        and v.status in ('pending', 'active')
        and prs.id = parsed_submission_id
        and prs.submitted_by = auth.uid()
        and prs.status in ('draft', 'changes_requested')
    );
end;
$$;
