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
