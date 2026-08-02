import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../services/api";
import { clearPublicCart, getPublicCart, removePublicCartItem, updatePublicCartItem } from "../../utils/publicCart";
import { getId, itemImage, money, productName, toArray } from "../owner/ownerShared";

const cartProduct = (item) =>
  item.product || (typeof item.productId === "object" ? item.productId : item);
const cartProductId = (item) =>
  (typeof item.productId === "string" ? item.productId : getId(cartProduct(item)));
const imageFallback = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80";

const PublicCart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setItems(getPublicCart());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/cart");
      setItems(toArray(response.data, ["items", "cart.items"]));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load cart");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isLoggedIn) return undefined;
    const sync = () => setItems(getPublicCart());
    window.addEventListener("public-cart-updated", sync);
    return () => window.removeEventListener("public-cart-updated", sync);
  }, [isLoggedIn]);

  const updateQuantity = async (item, quantity) => {
    const productId = cartProductId(item);
    if (!isLoggedIn) {
      updatePublicCartItem(productId, quantity);
      toast.success("Cart updated");
      return;
    }
    setBusy(productId);
    try {
      await api.patch(`/cart/${productId}`, { quantity });
      toast.success("Cart updated");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update cart");
    } finally {
      setBusy("");
    }
  };

  const remove = async (item) => {
    const productId = cartProductId(item);
    if (!isLoggedIn) {
      removePublicCartItem(productId);
      toast.success("Removed from cart");
      return;
    }
    setBusy(productId);
    try {
      await api.delete(`/cart/${productId}`);
      toast.success("Removed from cart");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove item");
    } finally {
      setBusy("");
    }
  };

  const clearCart = async () => {
    if (!isLoggedIn) {
      clearPublicCart();
      toast.success("Cart cleared");
      return;
    }
    setBusy("clear");
    try {
      await api.delete("/cart");
      toast.success("Cart cleared");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not clear cart");
    } finally {
      setBusy("");
    }
  };

  const total = items.reduce((sum, item) => {
    const product = cartProduct(item);
    return sum + (item.quantity || 1) * (item.price || product?.discountPrice || product?.price || 0);
  }, 0);

  return (
    <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Shopping cart</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Your Cart</h1>
            <p className="mt-2 text-slate-400">
              {isLoggedIn ? "Manage product quantities or clear your cart." : "Guest cart is saved on this device. Login when you are ready to checkout."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/products" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Products</Link>
            {items.length > 0 && (
              <button type="button" onClick={clearCart} disabled={busy === "clear"} className="rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60">
                {busy === "clear" ? "Clearing..." : "Clear Cart"}
              </button>
            )}
            {!isLoggedIn && items.length > 0 && (
              <button type="button" onClick={() => navigate("/login")} className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                Login
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-slate-950" />
          ) : items.length ? (
            <div className="space-y-4">
              {items.map((item) => {
                const product = cartProduct(item);
                const productId = cartProductId(item);
                const quantity = item.quantity || 1;
                const price = item.price || product?.discountPrice || product?.price || 0;
                return (
                  <article key={productId} className="grid gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                    <img src={itemImage(product) || imageFallback} alt={productName(product)} className="h-24 w-24 rounded-xl object-cover" />
                    <div>
                      <h2 className="font-bold text-white">{productName(product)}</h2>
                      <p className="mt-1 text-sm text-slate-500">{money(price)} each</p>
                      <p className="mt-1 text-sm font-semibold text-cyan-300">Total {money(price * quantity)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busy === productId || quantity <= 1} onClick={() => updateQuantity(item, quantity - 1)} className="rounded-xl border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/5 disabled:opacity-50">-</button>
                      <span className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">{quantity}</span>
                      <button type="button" disabled={busy === productId} onClick={() => updateQuantity(item, quantity + 1)} className="rounded-xl border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/5 disabled:opacity-50">+</button>
                      <button type="button" disabled={busy === productId} onClick={() => remove(item)} className="rounded-xl border border-red-400/30 px-3 py-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50">Remove</button>
                    </div>
                  </article>
                );
              })}
              <div className="flex justify-end border-t border-white/10 pt-4">
                <p className="text-xl font-bold text-white">Subtotal: {money(total)}</p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <h2 className="text-xl font-bold text-white">Cart is empty</h2>
              <p className="mt-2 text-slate-500">Add products from the public product page.</p>
              <Link to="/products" className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Browse Products</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PublicCart;
