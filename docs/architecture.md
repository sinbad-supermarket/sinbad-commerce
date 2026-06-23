# Sinbad Commerce Lab Architecture

Sinbad Commerce Lab is a phased commerce architecture project. Phase 1 is limited to a bilingual catalog foundation with products, categories, product images, product search, and admin product management.

The project uses Next.js App Router, Supabase, PostgreSQL, and Vercel.

## Phase 1 Boundaries

Included:

- Products
- Categories
- Product-category assignments
- Product images
- Product search
- Admin product management foundation

Excluded:

- Vendors
- Vendor dashboards
- Marketplace logic
- Orders
- Payments
- Shipping
- Customer accounts
- Mobile apps
- External integrations

## Application Architecture

The application is organized around public storefront routes, admin routes, feature modules, shared components, Supabase clients, and documentation.

Public routes live under `app/(public)`. Admin routes live under `app/admin`. Domain logic will live under `features` as later milestones are implemented.

## Permanent Experience Requirements

All public, admin, and vendor pages/components must support desktop and mobile from the beginning.

Responsive design requirements:

- Tables must not break on mobile.
- Forms must remain usable on mobile.
- Navigation must remain usable on mobile.
- Pages must avoid horizontal overflow.
- Product grids must adapt to screen width.
- Arabic and English text must not break layout.
- Images must keep their aspect ratio.

Public pages must be SEO-ready from the beginning where appropriate, including product pages, category pages, search pages, and vendor store pages.

SEO requirements:

- Page title.
- Meta description.
- Canonical URL.
- Basic Open Graph metadata.
- Clean slugs.
- Future structured data compatibility.

## Data Architecture

Phase 1 will use PostgreSQL tables for products, categories, product-category relationships, product images, and admin users. Database migrations are intentionally deferred until Milestone 2.

Products and categories are designed for English and Arabic content from the beginning. Products will support multiple categories through a join table.

## Supabase Architecture

Supabase will provide PostgreSQL, Auth, Storage, and RLS. This milestone adds only the client structure:

- Browser client
- Server client
- Admin/service client placeholder

Milestone 3 adds the admin auth foundation:

- Email/password admin login through Supabase Auth.
- Centralized server-side admin guard.
- Admin lookup through `public.admin_users`.
- Role foundation for `owner`, `admin`, and `editor`.
- RLS policies for admin select, insert, and update access.
- Strict public read policies for active catalog records only.

No destructive delete policies are included. Later catalog workflows should use archive or deactivate behavior.

## Admin Category Management

Milestone 4 adds admin category management using the existing admin guard and RLS policies:

- Admin category list.
- Category create and edit flows.
- Bilingual fields for English and Arabic names/descriptions.
- Parent category selection.
- Sort order.
- Active/inactive state.
- Server-side slug generation, normalization, and uniqueness checks.

Categories are not deleted in Phase 1. Admins deactivate categories with `is_active = false`.

## Admin Product Management

Milestone 5 adds admin product management using existing admin auth and RLS:

- Admin product list.
- Product create and edit flows.
- Bilingual product names and descriptions.
- Optional SKU, barcode, and price.
- Product statuses: `draft`, `active`, and `archived`.
- Multi-category assignment through `product_categories`.
- Primary category selection.
- Server-side slug generation, normalization, and uniqueness checks.

Products are not deleted in Phase 1. Admins use `archived` status instead of destructive delete behavior.

Draft and archived products may have zero categories. Active products must have at least one category.

## Product Images Management

Milestone 6 adds admin product image management using Supabase Storage and the existing `product_images` table:

- Private `product-images` storage bucket.
- Admin-only storage object management.
- Admin image upload, metadata editing, ordering, primary selection, and deletion.
- Bilingual alt text fields.
- Image metadata stored in PostgreSQL.

Public image delivery is deferred until the public catalog milestone.

## Public Catalog

Milestone 7 adds public catalog browsing:

- Homepage with active categories and latest active products.
- Public product listing with basic pagination.
- Public product detail page.
- Public category page.
- Active products and active categories only.
- Primary product image when available.
- Primary category breadcrumb when available.
- English primary display with Arabic secondary display.

The `product-images` bucket remains private. Public pages use a narrow server-only signed URL helper after active product/image metadata has already been read through normal RLS-protected public queries.

## Product Search

Milestone 8 adds public product search:

- Public search page.
- PostgreSQL full-text search through `products.search_vector`.
- Exact case-insensitive SKU and barcode matching.
- English and Arabic product fields.
- Category-name search through the maintained search vector.
- Active products only.
- Previous/next pagination.

Search uses a public-safe RPC and does not use the service-role client. The service-role client remains limited to server-only signed image URL generation.

## Vendor Store Requirement

Each vendor must have a shareable public store URL:

```text
/store/[vendorSlug]
```

Vendor store pages must be public only when:

- `vendor.status = 'active'`
- `vendor.is_public = true`

Vendor products must appear on the store only when:

- `product.vendor_id = vendor.id`
- `product.status = 'active'`
- `product.review_status = 'approved'`

Vendor store routes are not implemented until their approved milestone.

## Production Readiness

Milestone 10 records final production readiness criteria in `docs/production-readiness.md`.

## First Admin Setup

Create the first admin manually in the Supabase Dashboard:

1. Create a Supabase Auth user with email/password.
2. Copy the Auth user ID.
3. Insert a matching row in `public.admin_users`.

Example SQL using placeholders only:

```sql
insert into public.admin_users (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'owner');
```

Do not commit real emails, passwords, access tokens, or service keys.
