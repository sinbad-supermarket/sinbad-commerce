create or replace function public.submit_vendor_product_review_submission(
  p_submission_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.product_review_submissions%rowtype;
  vendor_status text;
begin
  select *
  into submission_record
  from public.product_review_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission was not found.';
  end if;

  if submission_record.submitted_by <> auth.uid() then
    raise exception 'Only the original submitter can submit this product.';
  end if;

  if not public.is_active_vendor_member(submission_record.vendor_id) then
    raise exception 'Vendor access required.';
  end if;

  select status
  into vendor_status
  from public.vendors
  where id = submission_record.vendor_id;

  if vendor_status not in ('pending', 'active') then
    raise exception 'This vendor account cannot submit products for review.';
  end if;

  if submission_record.status not in ('draft', 'changes_requested', 'rejected') then
    raise exception 'This product cannot be submitted for review.';
  end if;

  update public.product_review_submissions
  set
    status = 'submitted',
    submitted_at = now(),
    reviewed_by = null,
    reviewed_at = null
  where id = p_submission_id;

  if submission_record.change_type = 'update' then
    if submission_record.product_id is null then
      raise exception 'Update submissions require a canonical product.';
    end if;

    update public.products
    set
      review_status = 'pending_review',
      updated_at = now()
    where id = submission_record.product_id
      and vendor_id = submission_record.vendor_id;

    if not found then
      raise exception 'Canonical product does not belong to this vendor.';
    end if;
  end if;
end;
$$;

revoke all on function public.submit_vendor_product_review_submission(uuid) from public;
grant execute on function public.submit_vendor_product_review_submission(uuid) to authenticated;
