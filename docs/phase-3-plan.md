# Phase 3 Plan

Phase 3 introduces marketplace commerce foundations while keeping online payments, shipping integrations, customer accounts, inventory, and vendor order management out of scope until later approval.

## Milestone 1: Cart and Customer Session Foundation

Implemented anonymous cart persistence:

- Public cart page at `/cart`.
- HTTP-only `cart_session_id` cookie for anonymous cart identity.
- Server-only service-role access isolated to cart and order persistence.
- Normal public Supabase queries for product eligibility.
- Add to Cart on public product detail pages only.
- Add action redirects to `/cart`.
- Quantity update and remove item actions.
- Cart items grouped by vendor.
- Subtotal based on stored unit price snapshots.

Cart items store snapshots for:

- `product_id`
- `vendor_id`
- `quantity`
- `unit_price`
- product English/Arabic names
- product slug
- vendor English name
- vendor slug

Products can be added to cart only when:

- `product.status = active`
- `product.review_status = approved`
- `vendor.status = active`
- `vendor.is_public = true`

No order is created in this milestone. Vendors cannot view customer carts.

## Deferred

- Online payments.
- Shipping.
- Order management.
- Customer accounts.
- Vendor order management.
- Inventory.
- Cart cleanup/expiration.
- Add to Cart on product cards.
- Mobile apps.

## Milestone 2: Checkout and Cash on Delivery Order Creation

Implemented Cash on Delivery checkout:

- Checkout page at `/checkout`.
- Customer name, phone, optional email, delivery area, address, and notes.
- Cash on Delivery is the only payment method.
- Active cart is converted into an order through a server-only checkout action.
- Cart is revalidated during order creation.
- Product and vendor public eligibility are rechecked before order rows are created.
- Order item snapshots are copied from cart item snapshots.
- Multi-vendor orders are represented with `vendor_orders`.
- Cart items are deleted and the cart is marked `abandoned` after successful order creation.
- Confirmation page uses `/order-confirmation/[orderNumber]?token=...`.
- Confirmation requires both `order_number` and a cryptographically random `confirmation_token`.

Checkout creates:

- `orders`
- `order_items`
- `vendor_orders`

Order defaults:

- `payment_method = cash_on_delivery`
- `payment_status = pending`
- `order_status = placed`

Still deferred:

- Online payments.
- Payment gateways.
- Shipping providers.
- Inventory reservation.
- Customer accounts.
- Vendor order dashboard.

## Milestone 3: Admin Order Management Foundation

Implemented admin order management:

- Admin order list at `/admin/orders`.
- Admin order detail at `/admin/orders/[id]`.
- Admin can view customer and delivery information.
- Admin can view Cash on Delivery payment method and pending payment status.
- Admin can view order items and immutable order item snapshots.
- Admin can view vendor order splits.
- Admin can update parent `orders.order_status`.
- Admin can update `vendor_orders.status`.
- Payment status remains read-only.

Order and vendor order statuses:

- `placed`
- `confirmed`
- `preparing`
- `out_for_delivery`
- `delivered`
- `cancelled`

Admin order management uses normal Supabase server clients with admin RLS policies. No service-role client is used for normal admin order management.

## Milestone 4: Vendor Application / Vendor Onboarding Request Flow

Implemented vendor application intake without adding customer accounts, payments,
shipping, inventory, or new commerce workflows.

Public applicants submit at `/vendors/apply` with a simplified flow aligned to
the public Sinbad vendor application:

- Company Info for license and company review.
- Owner Info for legal, compliance, and account responsibility.
- Store Info for future public store setup.
- Operations / Address for order routing and fulfillment details.
- Payout / Bank Info for future vendor settlement workflows.
- Document Uploads explains the manual document collection process.
- Agreement for V1 commission and Sinbad-managed delivery acknowledgements.

Owner and legal data are private admin records and are not displayed publicly. Store
profile fields are used only after admin approval creates a vendor.
Bank details are private admin records and are never displayed publicly.

Vendor application records use:

- `vendor_applications`
- private storage bucket `vendor-application-documents`

Required documents are collected manually after the application is submitted:

- owner civil ID or passport document
- commercial license document
- authorization document when the authorized signatory differs from the owner
- optional bank document

The public form is text-data only for reliability. Public document uploads are
deferred until a future one-file-at-a-time upload flow is built. Existing private
document columns and the private `vendor-application-documents` bucket remain in
place for future/manual admin-supported document handling. Signed document URLs
are generated only after an admin guard passes.

The public form requires applicants to acknowledge:

- the 5% Sinbad commission for V1 vendor sales
- Sinbad-managed delivery in V1

Admin review is available at:

- `/admin/vendor-applications`
- `/admin/vendor-applications/[id]`

Admin can:

- view application details and private documents
- mark an application under review
- approve an application
- reject an application with a required rejection reason

Approval creates a private active vendor from store/legal data:

- `vendors.name_en = store_name_en`
- `vendors.name_ar = store_name_ar`
- `vendors.slug = proposed_store_slug`
- `vendors.description_en = short_store_description_en`
- `vendors.description_ar = short_store_description_ar`
- `vendors.status = active`
- `vendors.is_public = false`

Approval stores the selected `vendor_login_email`, defaulting to `owner_email`.
No Auth user, invite, or `vendor_users` membership is created automatically. Admins
must complete user setup manually through the existing vendor user assignment flow.

Rejection does not create a vendor, Auth user, or membership. Rejection email
delivery remains manual until an email provider is explicitly approved.

Security boundaries:

- Public users cannot read applications.
- Public users cannot read documents.
- Admins can read and update applications through RLS.
- Public submission uses isolated server-only service-role persistence.
- Service-role keys are never exposed to browser components.
- Bank details are collected for later settlement workflows only; no wallet,
  payout, or payment provider integration exists in this milestone.

## Milestone 5: Sinbad Catalog Taxonomy Foundation

Implemented Sinbad Taxonomy v1 as a controlled category/subcategory foundation
for future product submission, search, filtering, SEO, and admin catalog
management.

The existing `categories` table already supported:

- parent-child hierarchy through `parent_id`
- bilingual names and descriptions
- unique slugs
- active/inactive state
- sort order
- timestamps
- RLS-enabled admin/public access boundaries

Taxonomy v1 seeds parent categories and subcategories for:

- Grocery & Food
- Beverages
- Beauty & Personal Care
- Baby & Kids
- Household & Cleaning
- Home & Kitchen
- Electronics
- Mobile Accessories
- Fashion
- Shoes & Bags
- Health & Wellness
- Pet Supplies
- Toys & Games
- Stationery & Office
- Sports & Outdoors
- Automotive Accessories
- Books & Media
- Flowers & Gifts
- Services & Digital

Restricted placeholders such as supplements, gift cards, and digital services
are seeded inactive until legal, policy, and fulfillment rules are approved.

Prohibited category policy:

- Do not seed or allow alcohol, pork or pork-derived food, tobacco, cigarettes,
  vapes, nicotine, CBD, THC, recreational drugs, prescription or controlled
  medicine, adult sexual products, pornographic material, gambling, weapons,
  firearms, ammunition, explosives, political or extremist materials,
  counterfeit goods, illegal surveillance/spyware, or products prohibited in
  Kuwait/GCC/Arab markets.

Admin category management rules:

- Admins can add, edit, disable, and sort categories and subcategories.
- Categories are not hard-deleted through the admin UI.
- Disabling uses `is_active = false`.
- Admins can see active and inactive categories.
- Public and future vendor product forms must use active categories only.

Future product form requirement:

- Product Submission Form v2 must use controlled searchable dropdowns.
- Category dropdown must show active parent categories.
- Subcategory dropdown must be filtered by the selected parent category and
  disabled/hidden until a parent category is selected.
- A suggested category field can be added later when no controlled match exists,
  but it must not create categories automatically.

## Milestone 6: Vendor Product Submission Form v2

Implemented a marketplace-quality vendor product submission form while keeping
checkout, orders, payments, shipping, inventory, customer accounts, mobile apps,
and vendor application flows unchanged.

The vendor product submission flow now collects:

- product images first, using the existing private staged-image system
- bilingual short descriptions
- bilingual product names
- controlled category and subcategory selections from active categories only
- optional suggested category text stored only in the submission snapshot
- brand name
- optional product video URL
- regular price and optional sale price
- stock quantity
- SKU and barcode
- availability: `in_stock`, `out_of_stock`, or `preorder`
- product condition: `new`, `refurbished`, or `used`
- optional key/value product specifications
- optional warranty text
- bilingual full descriptions
- intended canonical product status after approval

Image rules:

- minimum 2 images before review submission
- maximum 8 images
- JPEG, PNG, and WebP only
- existing 5 MB per-image limit remains
- dimensions must be between 330x330 and 5000x5000 pixels
- primary image is shown first in vendor/admin review views and is applied as the
  canonical primary image on approval
- replacing an image is handled through delete + upload replacement to preserve
  the existing staged storage/RLS model

Snapshot and approval behavior:

- Vendor edits still write only to `product_review_submissions.snapshot`.
- `/vendor/products/new` creates a private editable submission workspace so
  vendors can upload staged images immediately without saving product details
  first.
- Vendors cannot mutate canonical `products`, `product_categories`, or
  `product_images` directly.
- Saving product fields preserves existing staged images in the snapshot.
- Submitting for review revalidates required fields, category assignment, image
  count, image dimensions, sale price, stock quantity, and availability.
- Admin approval revalidates the snapshot atomically and copies supported fields
  into canonical `products`.

Canonical `products` now supports:

- `sale_price`
- `brand_name`
- `video_url`
- `stock_quantity`
- `availability`
- `product_condition`
- `specifications`
- `warranty`

UX refinement:

- Category and subcategory use single searchable selector controls rather than
  separate search inputs plus dropdowns.
- Subcategory remains disabled until a parent category is selected.
- Specifications start empty and vendors add rows only when needed.
- The form is grouped as Images, Basic Product Information, Pricing &
  Inventory, Specifications & Warranty, Full Description, and Actions.
- Submit For Review is the primary action; Save Draft remains available for
  incomplete work.
- Brand selection uses a searchable suggestion input plus a snapshot-only
  Request New Brand field. A global brand catalog remains deferred.

The public catalog remains governed by the existing public visibility rules:

- `product.status = active`
- `product.review_status = approved`
- vendor is active
- vendor is public

Deferred:

- global brand catalog and brand logos
- advanced category suggestions workflow
- attribute templates
- inventory reservation
- public storefront display for every new v2 field

## Phase B: Vendor Products Dashboard and Revision Workflow

Implemented a professional vendor product management dashboard at
`/vendor/products` while keeping checkout, orders, payments, shipping,
inventory automation, customer accounts, vendor applications, taxonomy,
description editor, and image upload architecture unchanged.

Vendor dashboard now includes:

- summary cards for All Products, Approved, Pending Review, Draft, Rejected,
  Hidden, and Out Of Stock
- Add Product primary action
- search by product name, SKU, and barcode
- filters for category, brand, status, stock, and updated date
- sorting by newest, oldest, and recently updated
- unified product table with image, product name, category, brand, price, stock,
  status, updated date, and merchant actions

Merchant-facing statuses:

- Approved
- Pending Review
- Draft
- Rejected
- Changes Requested
- Hidden
- Out Of Stock

Revision workflow business rule:

- When a vendor submits changes to an already approved canonical product, the
  canonical product is immediately moved to `review_status = pending_review`.
- Public catalog, search, category pages, product detail pages, cart eligibility,
  and vendor store pages continue to require `status = active`,
  `review_status = approved`, and an active/public vendor.
- This means the product is hidden from customers while the update is under
  review.
- If admin approves the submission, the approval RPC applies the submitted
  snapshot to the canonical product and restores `review_status = approved`.
- If admin rejects or requests changes, the canonical product remains hidden
  through `review_status = rejected` or `changes_requested`.
- Vendor can see the admin reason and edit/resubmit rejected or
  changes-requested submissions.

Implementation notes:

- Vendors still cannot directly update canonical `products`.
- The submit transition uses a narrow server-side database lifecycle instead of
  broad product update policies.
- The vendor-facing Delete action for drafts cancels the draft submission rather
  than deleting database rows.
- Duplicate creates a new draft submission from the existing product snapshot
  with SKU/barcode cleared so marketplace uniqueness rules remain safe.

Still deferred:

- customer-facing product status messaging
- product version history
- audit logs for every product lifecycle action
- global brand catalog
- category suggestion review queue
