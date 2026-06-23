alter table public.vendor_applications
add column bank_name text,
add column account_holder_name text,
add column iban text,
add column account_number text,
add column bank_branch text,
add column bank_document_path text;

update public.vendor_applications
set
  bank_name = 'Not collected',
  account_holder_name = 'Not collected',
  iban = 'Not collected'
where bank_name is null
   or account_holder_name is null
   or iban is null;

alter table public.vendor_applications
alter column bank_name set not null,
alter column account_holder_name set not null,
alter column iban set not null,
add constraint vendor_applications_bank_name_required check (length(trim(bank_name)) > 0),
add constraint vendor_applications_account_holder_name_required check (length(trim(account_holder_name)) > 0),
add constraint vendor_applications_iban_required check (length(trim(iban)) > 0);
