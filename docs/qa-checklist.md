# Phase 1 QA and Security Checklist

This checklist verifies the Phase 1 catalog foundation: admin auth, categories, products, product images, public catalog, and public search.

## Security Checks

- RLS is enabled on `admin_users`, `categories`, `products`, `product_categories`, and `product_images`.
- Public policies expose active categories only.
- Public policies expose active products only.
- Public product-category reads require linked active product and active category.
- Public product-image reads require linked active product.
- Admin policies require authenticated admin access.
- No DELETE policies exist except:
  - `public.product_images`
  - `storage.objects` for the private `product-images` bucket
- Service-role usage is limited to server-only signed image URL generation.
- Admin routes require the centralized admin guard.
- Normal admin CRUD uses the server Supabase client, not the service-role client.

## RPC Checks

- `current_admin_role()` exists.
- `is_admin()` exists.
- `replace_product_category_assignments()` exists and checks admin access.
- `search_active_products()` exists, is security invoker, and filters `status = 'active'`.

## Manual Admin QA

- Logged-out users are redirected from `/admin` to `/admin/login`.
- Non-admin authenticated users cannot enter admin pages.
- Admin users can log in.
- Logout clears the admin session.
- Categories can be listed, created, edited, activated, and deactivated.
- Category delete behavior does not exist.
- Products can be listed, created, edited, drafted, activated, and archived.
- Active products require at least one category.
- Draft and archived products may have zero categories.
- Product delete behavior does not exist.
- Product images can be uploaded, listed, edited, ordered, made primary, and deleted.
- Invalid image MIME types are rejected.
- Images larger than 5 MB are rejected.

## Manual Public QA

- Homepage shows active categories and latest active products only.
- `/products` shows active products only.
- Draft and archived product detail URLs return 404.
- Inactive category URLs return 404.
- Product detail uses the primary category breadcrumb when available.
- Product cards use primary images when available.
- Public search returns active products only.
- Search works for English text, Arabic text, SKU, barcode, and category names.
- Search pagination preserves the query.

## Scope Checks

- No cart, checkout, orders, payments, shipping, vendors, customer accounts, marketplace features, mobile apps, or seed data are present.
