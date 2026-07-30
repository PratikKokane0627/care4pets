import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, getId, itemImage, money, notifyOwnerShopCounts, productName } from "../ownerShared";

const wishlistProduct = (item) => item.productId || item.product || item;

const Wishlist = () => {
  const remove = async (item, refresh) => {
    try {
      await api.delete(`/wishlist/${getId(wishlistProduct(item))}`);
      toast.success("Removed from wishlist");
      notifyOwnerShopCounts();
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove item");
    }
  };

  const moveToCart = async (item, refresh) => {
    try {
      await api.post(`/wishlist/${getId(wishlistProduct(item))}/move-to-cart`);
      toast.success("Moved to cart");
      notifyOwnerShopCounts();
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not move to cart");
    }
  };

  const clearWishlist = async (refresh) => {
    if (!window.confirm("Clear all wishlist items?")) return;
    try {
      await api.delete("/wishlist");
      toast.success("Wishlist cleared");
      notifyOwnerShopCounts();
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not clear wishlist");
    }
  };

  return (
    <ResourceListPage
      title="Wishlist"
      description="Saved products for later."
      endpoint="/wishlist"
      dataKeys={["wishlistItems", "items", "wishlist.items", "wishlist"]}
      searchPlaceholder="Search wishlist"
      getTitle={(item) => productName(wishlistProduct(item))}
      getSubtitle={(item) => wishlistProduct(item).brand || "Wishlist product"}
      getMeta={(item) => [money(wishlistProduct(item).price)]}
      getImage={(item) => itemImage(wishlistProduct(item))}
      imageFallback="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
      emptyTitle="Wishlist is empty"
      emptyMessage="Products you save will appear here."
      emptyAction={
        <Button as={Link} to="/owner/shop">
          Browse Shop
        </Button>
      }
      detailPath={null}
      renderBeforeList={({ items, refresh }) =>
        items.length ? (
          <div className="flex justify-end">
            <Button variant="danger" onClick={() => clearWishlist(refresh)}>
              Clear Wishlist
            </Button>
          </div>
        ) : null
      }
      renderActions={(item, { refresh }) => (
        <div className="grid w-full gap-2 sm:grid-cols-3">
          <Link
            to={`/owner/shop/${getId(wishlistProduct(item))}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white"
          >
            Details
          </Link>
          <Button className="w-full px-3" onClick={() => moveToCart(item, refresh)}>
            Move To Cart
          </Button>
          <Button className="w-full px-3" variant="danger" onClick={() => remove(item, refresh)}>
            Remove
          </Button>
        </div>
      )}
    />
  );
};

export default Wishlist;

