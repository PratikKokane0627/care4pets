import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, getId, itemImage, money, productName } from "../ownerShared";

const wishlistProduct = (item) => item.productId || item.product || item;

const Wishlist = () => {
  const remove = async (item, refresh) => {
    try {
      await api.delete(`/wishlist/${getId(wishlistProduct(item))}`);
      toast.success("Removed from wishlist");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove item");
    }
  };

  const moveToCart = async (item, refresh) => {
    try {
      await api.post(`/wishlist/${getId(wishlistProduct(item))}/move-to-cart`);
      toast.success("Moved to cart");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not move to cart");
    }
  };

  return (
    <ResourceListPage
      title="Wishlist"
      description="Saved products for later."
      endpoint="/wishlist"
      dataKeys={["items", "wishlist.items", "wishlist"]}
      searchPlaceholder="Search wishlist"
      getTitle={(item) => productName(wishlistProduct(item))}
      getSubtitle={(item) => wishlistProduct(item).brand || "Wishlist product"}
      getMeta={(item) => [money(wishlistProduct(item).price)]}
      getImage={(item) => itemImage(wishlistProduct(item))}
      imageFallback="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
      emptyTitle="Wishlist is empty"
      emptyMessage="Products you save will appear here."
      detailPath={(item) => `/owner/shop/${getId(wishlistProduct(item))}`}
      renderActions={(item, { refresh }) => (
        <>
          <Button onClick={() => moveToCart(item, refresh)}>Move To Cart</Button>
          <Button variant="danger" onClick={() => remove(item, refresh)}>Remove</Button>
        </>
      )}
    />
  );
};

export default Wishlist;

