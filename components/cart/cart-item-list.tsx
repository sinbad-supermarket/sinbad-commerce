import Link from "next/link";
import {
  removeCartItem,
  updateCartItemQuantity,
} from "@/features/cart/actions";
import type { CartVendorGroup } from "@/features/cart/types";
import { formatCartMoney } from "./cart-summary";

type CartItemListProps = {
  groups: CartVendorGroup[];
};

function lineTotal(unitPrice: string | number | null, quantity: number) {
  return unitPrice === null ? 0 : Number(unitPrice) * quantity;
}

export function CartItemList({ groups }: CartItemListProps) {
  return (
    <div className="cart-groups">
      {groups.map((group) => (
        <section className="cart-vendor-group" key={group.vendorId}>
          <div className="cart-vendor-heading">
            <h2>{group.vendorNameEn}</h2>
            <Link className="muted-link" href={`/store/${group.vendorSlug}`}>
              /store/{group.vendorSlug}
            </Link>
          </div>

          <div className="cart-items">
            {group.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-main">
                  <Link href={`/products/${item.product_slug}`}>
                    <h3>{item.product_name_en}</h3>
                  </Link>
                  <p className="arabic-text" dir="rtl">
                    {item.product_name_ar}
                  </p>
                  <p className="field-help">Unit price: {formatCartMoney(item.unit_price)}</p>
                </div>

                <form
                  className="cart-quantity-form"
                  action={updateCartItemQuantity.bind(null, item.id)}
                >
                  <label className="field compact-field">
                    <span>Quantity</span>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      max="99"
                      step="1"
                      defaultValue={item.quantity}
                    />
                  </label>
                  <button className="secondary-button" type="submit">
                    Update
                  </button>
                </form>

                <p className="cart-line-total">
                  {formatCartMoney(lineTotal(item.unit_price, item.quantity))}
                </p>

                <form action={removeCartItem.bind(null, item.id)}>
                  <button className="danger-button" type="submit">
                    Remove
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
