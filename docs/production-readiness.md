# Production Readiness Review

This document is the final Phase 1 production readiness checklist for Sinbad Commerce Lab.

## Final Phase 1 Completion Checklist

- Next.js production build passes.
- Lint passes.
- Remote security verification passes.
- Supabase migrations are applied.
- Admin login/logout works.
- Admin category management works.
- Admin product management works.
- Admin product image management works.
- Public homepage works.
- Public product listing works.
- Public product detail works.
- Public category page works.
- Public search works.
- Public pages show active products and active categories only.
- No out-of-scope features are present.

## Environment Variable Checklist

Required production variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Rules:

- `NEXT_PUBLIC_SUPABASE_URL` may be exposed to the browser.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be exposed to the browser because RLS protects data access.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- Do not commit `.env`, `.env.local`, passwords, service keys, or access tokens.
- Production values should point to the approved Supabase project.

## Vercel Deployment Checklist

- Project is connected to the correct repository.
- Framework preset is Next.js.
- Build command is `npm run build`.
- Production environment variables are configured.
- Preview environment variables are configured if previews are used.
- Production domain and HTTPS are configured.
- Latest deployment succeeds.
- Public routes are checked after deploy:
  - `/`
  - `/products`
  - `/search`
  - `/products/[slug]`
  - `/categories/[slug]`
- Admin routes are checked after deploy:
  - `/admin/login`
  - `/admin`
  - `/admin/categories`
  - `/admin/products`

## Supabase Checklist

- Linked project ref is confirmed.
- All migrations are applied:
  - `20260623084530`
  - `20260623091011`
  - `20260623092218`
  - `20260623092759`
  - `20260623094141`
- Tables exist:
  - `admin_users`
  - `categories`
  - `products`
  - `product_categories`
  - `product_images`
- RLS is enabled on all Phase 1 tables.
- RPCs exist:
  - `current_admin_role`
  - `is_admin`
  - `replace_product_category_assignments`
  - `search_active_products`
- Storage bucket exists:
  - `product-images`
- Storage bucket is private.
- Storage bucket limit is 5 MB.
- Storage bucket allows JPEG, PNG, and WebP.
- First admin user is created manually in Supabase Auth.
- Matching `admin_users` row is created manually.

## Security Checklist

- Admin routes use centralized admin guard.
- Admin server actions call `requireAdmin()` before writes.
- Public catalog reads use normal server Supabase client and RLS.
- Public search uses `search_active_products`.
- Service-role client is limited to server-only signed image URL generation.
- Draft and archived products are not public.
- Inactive categories are not public.
- Product/category/admin destructive delete behavior is not available.
- Approved delete behavior is limited to product images and storage objects.
- Storage object management requires admin access.
- No real secrets are committed.

## Backup and Recovery Recommendations

- Confirm Supabase automatic backups are available for the project tier.
- Document the restore process before production usage.
- Keep all schema changes migration-based.
- Avoid manual production schema changes in the Dashboard.
- Take a pre-launch database dump after final QA if production data is entered.
- Remember that Supabase Storage objects are separate from table-only exports.
- Document how product images should be recovered if storage data is affected.

## Monitoring Recommendations

- Enable Vercel deployment notifications.
- Monitor Vercel build and runtime logs.
- Monitor Supabase API logs.
- Monitor Supabase Auth logs for failed admin login attempts.
- Monitor database size and storage usage.
- Review slow query behavior if catalog/search grows.
- Add structured app logging in a future phase if operational needs increase.

## Known Risks

- Browser QA requires manually created admin and non-admin test users.
- No automated end-to-end browser suite exists yet.
- Category hierarchy prevents direct self-parenting only; deeper cycle prevention is deferred.
- Product image delete spans Storage and Postgres and is not fully atomic.
- Search relevance is basic for Arabic and English and may need later tuning.
- Public image display uses signed URLs from a private bucket.
- First admin setup is manual.

## Explicitly Excluded Future Features

The following are not part of Phase 1:

- Customers
- Vendors
- Vendor dashboards
- Marketplace features
- Orders
- Payments
- Shipping
- Inventory
- Reviews
- Notifications
- Mobile apps
- Cart
- Checkout

## Final Approval Criteria

Phase 1 is ready when:

- `npm run build` passes.
- `npm run lint` passes.
- `npm run verify:remote-security` passes.
- Vercel production deployment succeeds.
- Production environment variables are configured.
- Supabase project has all migrations applied.
- Manual admin setup is complete.
- Manual QA checklist passes for admin and public catalog flows.
- No out-of-scope features are present.
