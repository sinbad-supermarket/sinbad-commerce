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
