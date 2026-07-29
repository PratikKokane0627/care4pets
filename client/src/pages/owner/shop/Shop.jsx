import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, getId, itemImage, money, notifyOwnerShopCounts, productName, toArray } from "../ownerShared";

const Shop = () => {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [petType, setPetType] = useState("");
  const [inStock, setInStock] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((response) => setCategories(toArray(response.data, ["categories"])))
      .catch(() => setCategories([]));
  }, []);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (petType) params.set("petType", petType);
    if (inStock) params.set("inStock", inStock);
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }, [categoryId, inStock, petType]);

  const addToCart = async (product) => {
    try {
      await api.post("/cart", { productId: getId(product), quantity: 1 });
      toast.success("Added to cart");
      notifyOwnerShopCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart");
    }
  };

  const addToWishlist = async (product) => {
    try {
      await api.post("/wishlist", { productId: getId(product) });
      toast.success("Added to wishlist");
      notifyOwnerShopCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to wishlist");
    }
  };

  return (
    <ResourceListPage
      title="Pet Shop"
      description="Browse products, search items, and add pet essentials to cart."
      endpoint={endpoint}
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
      renderBeforeList={() => (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Category</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={getId(category)} value={getId(category)}>
                  {category.categoryName || category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Pet Type</span>
            <select
              value={petType}
              onChange={(event) => setPetType(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
            >
              <option value="">All pets</option>
              {["dog", "cat", "bird", "fish", "rabbit", "other", "all"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Stock</span>
            <select
              value={inStock}
              onChange={(event) => setInStock(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
            >
              <option value="">All stock</option>
              <option value="true">In stock</option>
            </select>
          </label>
        </div>
      )}
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

