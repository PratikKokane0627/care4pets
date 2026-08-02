import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiShoppingCart } from "react-icons/fi";

import api from "../../services/api";
import { addPublicCartItem } from "../../utils/publicCart";
import { getId, itemImage, money, productName, toArray } from "../owner/ownerShared";

const imageFallback = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80";

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSearch = new URLSearchParams(location.search).get("search") || "";
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [petType, setPetType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (petType) params.set("petType", petType);
    params.set("inStock", "true");
    return `/products?${params}`;
  }, [petType, search]);

  useEffect(() => {
    const nextSearch = new URLSearchParams(location.search).get("search") || "";
    setSearch(nextSearch);
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api
      .get(endpoint)
      .then((response) => {
        if (mounted) setProducts(toArray(response.data, ["products"]));
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Could not load products";
        if (mounted) setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [endpoint]);

  const addToCart = async (product) => {
    if (!localStorage.getItem("token")) {
      addPublicCartItem(product);
      toast.success("Added to cart");
      return;
    }
    try {
      await api.post("/cart", { productId: getId(product), quantity: 1 });
      toast.success("Added to cart");
      window.dispatchEvent(new Event("owner-shop-counts-updated"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart");
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : "/products");
  };

  return (
    <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Pet products</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Care4Pets Products</h1>
            <p className="mt-2 text-slate-400">Browse food, toys, wellness items, and daily pet essentials.</p>
          </div>
          <Link to="/cart" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
            <FiShoppingCart /> View Cart
          </Link>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5 md:grid-cols-[1fr_220px]">
          <form onSubmit={submitSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products by name, brand, category..."
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
            />
          </form>
          <select
            value={petType}
            onChange={(event) => setPetType(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
          >
            <option value="">All pets</option>
            {["dog", "cat", "bird", "fish", "rabbit", "other"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-slate-900" />)}
          </div>
        ) : products.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={getId(product)} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition hover:-translate-y-1 hover:border-cyan-300/35">
                <div className="aspect-[16/10] overflow-hidden bg-slate-950">
                  <img src={itemImage(product) || imageFallback} alt={productName(product)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">{product.categoryId?.categoryName || product.brand || "Pet product"}</p>
                  <h2 className="mt-2 text-xl font-bold text-white">{productName(product)}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{product.description || "Quality pet care product."}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">{money(product.discountPrice ?? product.price)}</p>
                      <p className="text-xs text-slate-500">{product.stock || 0} in stock</p>
                    </div>
                    <button type="button" onClick={() => addToCart(product)} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                      Add Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">No products found</h2>
            <p className="mt-2 text-slate-500">Try another search or pet type.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
