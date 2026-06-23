import { addToCart } from "@/features/cart/actions";

type AddToCartFormProps = {
  productId: string;
};

export function AddToCartForm({ productId }: AddToCartFormProps) {
  return (
    <form className="add-to-cart-form" action={addToCart.bind(null, productId)}>
      <label className="field compact-field">
        <span>Quantity</span>
        <input name="quantity" type="number" min="1" max="99" step="1" defaultValue="1" />
      </label>
      <button className="primary-button" type="submit">
        Add to cart
      </button>
    </form>
  );
}
