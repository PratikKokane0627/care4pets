import { useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, ErrorState, InfoBlock, Panel, itemImage, money, productName } from "../ownerShared";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const { loading, error } = useFetch(async () => {
    const response = await api.get(`/products/${id}`);
    setProduct(response.data.product || response.data);
  }, id);

  const addToCart = async () => {
    setSaving(true);
    try {
      await api.post("/cart", { productId: id, quantity: 1 });
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading product" />;

  return (
    <main>
      <PageHeader title={productName(product)} description={product?.description || "Product details"} />
      <ErrorState message={error} />
      {!product ? (
        <EmptyState title="Product not found" />
      ) : (
        <Panel className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <img
            src={itemImage(product) || "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"}
            alt={productName(product)}
            className="aspect-square w-full rounded-2xl object-cover"
          />
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Price" value={money(product.discountPrice ?? product.price)} />
              <InfoBlock label="Stock" value={product.stock} />
              <InfoBlock label="Brand" value={product.brand} />
              <InfoBlock label="Category" value={product.categoryId?.categoryName} />
            </div>
            <Button className="mt-6" onClick={addToCart} disabled={saving}>
              {saving ? "Adding..." : "Add To Cart"}
            </Button>
          </div>
        </Panel>
      )}
    </main>
  );
};

export default ProductDetails;

