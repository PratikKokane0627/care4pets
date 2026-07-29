import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, getId, itemImage, money, productName } from "../ownerShared";

const Shop = () => {
  const addToCart = async (product) => {
    try {
      await api.post("/cart", { productId: getId(product), quantity: 1 });
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart");
    }
  };

  const addToWishlist = async (product) => {
    try {
      await api.post("/wishlist", { productId: getId(product) });
      toast.success("Added to wishlist");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to wishlist");
    }
  };

  return (
    <ResourceListPage
      title="Pet Shop"
      description="Browse products, search items, and add pet essentials to cart."
      endpoint="/products"
      dataKeys={["products"]}
      searchPlaceholder="Search products"
      getTitle={productName}
      getSubtitle={(product) => product.categoryId?.categoryName || product.brand || "Pet product"}
      getMeta={(product) => [
        money(product.discountPrice ?? product.price),
        `${product.stock ?? 0} in stock`,
      ]}
      getImage={(product) => itemImage(product)}
      getStatus={(product) => (product.stock > 0 ? "active" : "out of stock")}
      imageFallback="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
      emptyTitle="No products found"
      emptyMessage="Shop products will appear here."
      renderActions={(product) => (
        <>
          <Button onClick={() => addToCart(product)} disabled={product.stock <= 0}>
            Add Cart
          </Button>
          <Button variant="ghost" onClick={() => addToWishlist(product)}>
            Wishlist
          </Button>
        </>
      )}
    />
  );
};

export default Shop;

