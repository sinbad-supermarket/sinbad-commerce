# Phase 2 Plan

Phase 2 introduces vendor ownership and admin-managed vendor profiles while keeping product publishing under admin control.

## Permanent Phase 2 Requirements

All vendor-facing, admin-facing, and public storefront work must be responsive from the beginning:

- No broken mobile tables.
- Forms usable on mobile.
- Navigation usable on mobile.
- No horizontal overflow.
- Product grids adapt to screen width.
- Arabic and English text must not break layout.
- Images keep aspect ratio.

Public pages must be SEO-ready where appropriate:

- Product pages.
- Category pages.
- Search pages.
- Vendor store pages.

SEO-ready means each applicable page should support a title, meta description, canonical URL, basic Open Graph metadata, clean slugs, and future structured data compatibility.

Each vendor must have a future shareable public store URL:

```text
/store/[vendorSlug]
```

Vendor store visibility must require `vendor.status = 'active'` and `vendor.is_public = true`.

Vendor products must appear on a store only when `product.vendor_id = vendor.id`, `product.status = 'active'`, and `product.review_status = 'approved'`.

## Completed Foundations

- Products belong to one vendor through `products.vendor_id`.
- Existing Phase 1 products are assigned to the internal vendor.
- Vendor tables exist: `vendors`, `vendor_users`, and `product_review_submissions`.
- Public product visibility requires an active approved product owned by an active public vendor.
- Vendor members may read their own vendor records and canonical products, but they cannot write directly to canonical products.

## Milestone 3: Admin Vendor Management

Implemented admin-only vendor management:

- Vendor list.
- Create vendor.
- Edit vendor profile.
- Manage vendor status: `pending`, `active`, `suspended`, `archived`.
- Toggle public/private vendor visibility.
- Preview future store URL as `/store/[vendorSlug]`.
- Assign existing Supabase Auth users to vendors by UUID.
- Manage vendor user role: `owner`, `manager`, `editor`.
- Activate or deactivate vendor memberships.

No delete behavior is included. Suspended or archived vendors are not automatically made private; future public vendor pages must require both `status = active` and `is_public = true`.

## Milestone 4: Vendor Dashboard Foundation

Implemented vendor access scaffolding:

- Dedicated vendor login at `/vendor/login`.
- Supabase Auth session reuse.
- Active vendor membership lookup through `vendor_users`.
- Selected vendor stored in the HTTP-only `selected_vendor_id` cookie.
- Vendor dashboard shell at `/vendor`.
- Multi-vendor selector at `/vendor/select`.
- Vendor status and public visibility display.
- Future store path preview as `/store/[vendorSlug]`.
- Disabled Products navigation placeholder.

Vendor access rules:

- Active vendors can access the dashboard.
- Pending vendors can access the dashboard with a warning.
- Suspended vendors can access the dashboard read-only with a warning.
- Archived vendors are blocked from dashboard access.
- Admins do not automatically become vendors unless assigned in `vendor_users`.
- Vendor users do not gain admin access unless also assigned in `admin_users`.

## Milestone 5: Vendor Product Submission Drafts

Implemented vendor product submission drafting without changing canonical public products:

- Vendor products page at `/vendor/products`.
- Vendor canonical product list for the selected vendor.
- Vendor product review submission list for the selected vendor.
- New product submission drafts.
- Update submission drafts created from existing vendor-owned canonical products.
- Draft and `changes_requested` submissions can be edited by the original submitter.
- Draft and `changes_requested` submissions can be submitted for admin review.
- Suspended vendors can view the dashboard but cannot create, edit, or submit product submissions.
- Pending vendors can create, edit, and submit product drafts.
- Only one active update submission is allowed per canonical product and vendor.
- Submission snapshots contain product fields, category assignments, a primary category marker, and an empty images array.
- Public catalog continues to read only canonical approved products from `products`.

Vendor submissions do not mutate `products`, `product_categories`, or `product_images`. Admin review and snapshot application are deferred to a later milestone.

## Milestone 6: Admin Product Review Workflow

Implemented admin product review controls:

- Review queue at `/admin/product-reviews`.
- Review detail page at `/admin/product-reviews/[id]`.
- Submitted snapshot review and comparison against canonical products for update submissions.
- Atomic approval through an admin-only SQL RPC.
- Approval revalidates snapshot shape, required names, normalized slug, optional SKU/barcode, price, intended status, category existence, primary category, empty images array, and canonical uniqueness.
- Approved create submissions create canonical products only during approval.
- Approved update submissions mutate canonical products only during approval.
- Category assignments are replaced from the approved snapshot during approval.
- Reject and request changes require admin notes and do not change canonical products.
- Public catalog continues to read canonical `products` only.

## Milestone 7: Vendor Submission Image Staging

Implemented private staged image management for product submissions:

- Vendor staged image upload on editable submission detail pages.
- Staged image metadata is stored only in `product_review_submissions.snapshot.images`.
- Staged images use private `product-images` storage paths under `vendor-submissions/{vendorId}/{submissionId}/{imageId}.{ext}`.
- Vendors can edit staged image alt text, sort order, primary image, and delete staged images while submissions are `draft` or `changes_requested`.
- Submitted, approved, rejected, and cancelled submissions are read-only for staged images.
- Admin review detail previews staged images with server-generated signed URLs.
- Approval revalidates staged image metadata and replaces canonical `product_images` from the approved snapshot.
- Approved staged images keep their existing storage path; no storage copy/move is performed in this milestone.
- Rejected/cancelled staged image cleanup is deferred.

## Milestone 8: Public Vendor Storefront

Implemented public vendor storefront browsing:

- Public vendor listing at `/store`.
- Public vendor store pages at `/store/[vendorSlug]`.
- Vendor pages are visible only when `status = active` and `is_public = true`.
- Vendor store product grids show only canonical products owned by that vendor where `status = active` and `review_status = approved`.
- Vendor profiles display bilingual names and descriptions.
- Logo and banner areas use clean fallback placeholders; vendor media upload and signed vendor media URLs are not implemented.
- Store product grids reuse existing product cards and product signed image handling.
- Vendor store products use previous/next pagination with 12 products per page.
- Vendor pages include title, meta description, canonical URL, and basic Open Graph metadata.
- Public storefront layouts must remain responsive on desktop and mobile.

## Deferred

- Vendor media upload and signed vendor media delivery.
- Store search/filter and product counts.
- Staged image cleanup jobs.
- Orders, payments, shipping, inventory, customers, marketplace commerce features, and mobile apps.
