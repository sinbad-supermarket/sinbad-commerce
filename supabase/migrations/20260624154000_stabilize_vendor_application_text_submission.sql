alter table public.vendor_applications
alter column owner_civil_id_or_passport_document_path drop not null,
alter column commercial_license_document_path drop not null;

alter table public.vendor_applications
drop constraint if exists vendor_applications_authorization_document_required;
