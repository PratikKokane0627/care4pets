import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, getId, itemImage, money, productName } from "../ownerShared";

const cartProduct = (item) => item.productId || item.product || item;

const Cart = () => {
  const updateQuantity = async (item, quantity, refresh) => {
    try {
      await api.patch(`/cart/${getId(cartProduct(item))}`, { quantity });
      toast.success("Cart updated");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update cart");
    }
  };

  const remove = async (item, refresh) => {
    try {
      await api.delete(`/cart/${getId(cartProduct(item))}`);
      toast.success("Removed from cart");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove item");
    }
  };

  return (
    <ResourceListPage
      title="Cart"
      description="Review products before checkout."
      endpoint="/cart"
      dataKeys={["items", "cart.items"]}
      searchPlaceholder="Search cart"
      getTitle={(item) => productName(cartProduct(item))}
      getSubtitle={(item) => `Quantity: ${item.quantity || 1}`}
      getMeta={(item) => [
        money(item.price || cartProduct(item)?.discountPrice || cartProduct(item)?.price),
        `Total: ${money(item.totalPrice || (item.quantity || 1) * (cartProduct(item)?.discountPrice || cartProduct(item)?.price || 0))}`,
      ]}
      getImage={(item) => itemImage(cartProduct(item))}
      imageFallback="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
      emptyTitle="Cart is empty"
      emptyMessage="Add shop products to your cart."
      detailPath={(item) => `/owner/shop/${getId(cartProduct(item))}`}
      action={
        <Button as={Link} to="/owner/checkout">
          Checkout
        </Button>
      }
      renderActions={(item, { refresh }) => (
        <>
          <Button variant="ghost" onClick={() => updateQuantity(item, Math.max((item.quantity || 1) - 1, 1), refresh)}>-</Button>
          <Button variant="ghost" onClick={() => updateQuantity(item, (item.quantity || 1) + 1, refresh)}>+</Button>
          <Button variant="danger" onClick={() => remove(item, refresh)}>Remove</Button>
        </>
      )}
    />
  );
};

export default Cart;

