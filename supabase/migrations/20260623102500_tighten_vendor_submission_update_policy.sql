drop policy if exists "Vendor members can update editable own vendor submissions"
on public.product_review_submissions;

create policy "Vendor members can update editable own vendor submissions"
on public.product_review_submissions
for update
to authenticated
using (
  public.is_active_vendor_member(vendor_id)
  and submitted_by = auth.uid()
  and status in ('draft', 'changes_requested')
)
with check (
  public.is_active_vendor_member(vendor_id)
  and submitted_by = auth.uid()
  and status in ('draft', 'submitted')
);
