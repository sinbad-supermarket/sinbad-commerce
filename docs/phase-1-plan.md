# Phase 1 Execution Plan

Phase 1 builds the catalog foundation only. Implementation proceeds through controlled milestones.

## Milestone 1: Project Foundation

- Initialize the Next.js App Router project.
- Add the recommended folder structure.
- Add base public and admin layouts.
- Add Supabase client structure.
- Add environment variable placeholders.
- Add architecture documentation.

## Milestone 2: Database Foundation

- Create database migrations.
- Add products, categories, product categories, product images, and admin users.
- Add indexes, constraints, and RLS.

## Milestone 3: Admin Auth

- Add Supabase Auth login.
- Protect admin routes.
- Add admin role lookup.
- Add centralized admin guard.
- Add admin RLS policies for select, insert, and update.
- Add strict public read RLS policies for active catalog records.
- Document manual first-admin setup.

## Milestone 4: Category Management

- Add bilingual category create, edit, list, and deactivate flows.
- Add parent category support.
- Add sort order.
- Add server-side slug generation and validation.
- Reuse the centralized admin guard.
- Do not add delete behavior.

## Milestone 5: Product Management

- Add bilingual product create, edit, list, and status flows.
- Add multi-category assignment and primary category selection.
- Add SKU, barcode, optional price, slug validation, and uniqueness checks.
- Require at least one category before a product can be active.
- Add an admin-only RPC for atomic product category assignment replacement.
- Do not add product delete behavior.

## Milestone 6: Product Images

- Add image upload, metadata, ordering, primary image selection, and deletion.
- Use a private Supabase Storage bucket named `product-images`.
- Add admin-only storage object management policies.
- Add bilingual image alt text.
- Defer public image delivery until the public catalog milestone.

## Milestone 7: Public Catalog

- Add product listing, product detail, category pages, and public visibility rules.
- Add homepage active categories and latest active products.
- Add previous/next pagination.
- Display primary product images through server-generated signed URLs.
- Keep search, cart, checkout, accounts, and marketplace features out of scope.

## Milestone 8: Search

- Add bilingual search using product fields, SKU, barcode, and category names.
- Add public search page and active-product results.
- Add PostgreSQL full-text search RPC.
- Reuse product cards, pagination, and signed image URL strategy.
- Defer admin search.

## Milestone 9: Security Review

- Verify RLS, storage policies, admin access, and public visibility boundaries.

## Milestone 10: Deployment Readiness

- Configure production deployment, environment variables, migration verification, and final QA.
- Record production readiness criteria in `docs/production-readiness.md`.
