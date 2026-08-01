import { useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  InfoBlock,
  Panel,
  formatDate,
  getId,
  itemImage,
  money,
  notifyOwnerShopCounts,
  productName,
  toArray,
} from "../ownerShared";

const ProductDetails = () => {
  const { id } = useParams();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    orderId: "",
    rating: 5,
    comment: "",
  });
  const [editingReviewId, setEditingReviewId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteReviewTarget, setDeleteReviewTarget] = useState("");
  const [deleteReviewBusy, setDeleteReviewBusy] = useState(false);

  const load = async () => {
    const [productRes, reviewsRes, ordersRes] = await Promise.all([
      api.get(`/products/${id}`),
      api.get(`/reviews/product/${id}`).catch(() => ({ data: [] })),
      api.get("/orders/my-orders").catch(() => ({ data: [] })),
    ]);
    setProduct(productRes.data.product || productRes.data);
    setReviews(toArray(reviewsRes.data, ["reviews"]));
    setOrders(toArray(ordersRes.data, ["orders"]));
  };

  const { loading, error } = useFetch(load, id);

  const productOrders = orders.filter((order) =>
    order.items?.some((item) => getId(item.productId) === id || item.productId === id)
  );

  const ownerReview = reviews.find(
    (review) =>
      getId(review.userId) === storedUser.id ||
      getId(review.userId) === storedUser._id ||
      review.userId === storedUser.id ||
      review.userId === storedUser._id
  );

  const saveReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, {
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        });
        toast.success("Review updated");
      } else {
        await api.post("/reviews", {
          productId: id,
          orderId: reviewForm.orderId,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        });
        toast.success("Review added");
      }
      setReviewForm({ orderId: "", rating: 5, comment: "" });
      setEditingReviewId("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save review");
    } finally {
      setSaving(false);
    }
  };

  const editReview = (review) => {
    setEditingReviewId(getId(review));
    setReviewForm({
      orderId: getId(review.orderId) || review.orderId || "",
      rating: review.rating || 5,
      comment: review.comment || "",
    });
  };

  const deleteReview = async () => {
    if (!deleteReviewTarget) return;
    setDeleteReviewBusy(true);
    try {
      await api.delete(`/reviews/${deleteReviewTarget}`);
      toast.success("Review deleted");
      setDeleteReviewTarget("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete review");
    } finally {
      setDeleteReviewBusy(false);
    }
  };

  const addToCart = async () => {
    setSaving(true);
    try {
      await api.post("/cart", { productId: id, quantity: 1 });
      toast.success("Added to cart");
      notifyOwnerShopCounts();
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
        <div className="space-y-6">
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
                <InfoBlock label="Rating" value={`${product.averageRating || 0} / 5`} />
                <InfoBlock label="Reviews" value={product.totalReviews || reviews.length} />
              </div>
              <Button className="mt-6" onClick={addToCart} disabled={saving}>
                {saving ? "Adding..." : "Add To Cart"}
              </Button>
            </div>
          </Panel>

          <Panel>
            <h2 className="mb-5 text-xl font-bold text-white">Product Reviews</h2>
            {productOrders.length > 0 && (!ownerReview || editingReviewId) && (
              <form onSubmit={saveReview} className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-[1fr_160px]">
                {!editingReviewId && (
                  <Field
                    label="Order"
                    as="select"
                    value={reviewForm.orderId}
                    onChange={(value) => setReviewForm({ ...reviewForm, orderId: value })}
                    options={[
                      { value: "", label: "Select delivered order" },
                      ...productOrders
                        .filter((order) => order.orderStatus === "Delivered")
                        .map((order) => ({
                          value: getId(order),
                          label: `Order #${String(getId(order)).slice(-6)} - ${formatDate(order.createdAt)}`,
                        })),
                    ]}
                    required
                  />
                )}
                <Field
                  label="Rating"
                  as="select"
                  value={reviewForm.rating}
                  onChange={(value) => setReviewForm({ ...reviewForm, rating: value })}
                  options={[5, 4, 3, 2, 1].map((rating) => ({ value: rating, label: `${rating} stars` }))}
                  required
                />
                <div className="md:col-span-2">
                  <Field
                    label="Comment"
                    as="textarea"
                    value={reviewForm.comment}
                    onChange={(value) => setReviewForm({ ...reviewForm, comment: value })}
                    required
                  />
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {editingReviewId ? "Update Review" : "Add Review"}
                  </Button>
                  {editingReviewId && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingReviewId("");
                        setReviewForm({ orderId: "", rating: 5, comment: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}

            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" description="Product reviews will appear here." />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const isMine =
                    getId(review.userId) === storedUser.id ||
                    getId(review.userId) === storedUser._id ||
                    review.userId === storedUser.id ||
                    review.userId === storedUser._id;

                  return (
                    <article key={getId(review)} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{review.userId?.name || "Pet owner"}</p>
                          <p className="mt-1 text-sm text-amber-300">{review.rating} / 5 stars</p>
                        </div>
                        {isMine && (
                          <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => editReview(review)}>Edit</Button>
                            <Button variant="danger" onClick={() => setDeleteReviewTarget(getId(review))}>Delete</Button>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{review.comment}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
          <ConfirmDialog
            open={Boolean(deleteReviewTarget)}
            title="Delete review"
            message="This product review will be permanently removed."
            confirmText="Delete Review"
            danger
            loading={deleteReviewBusy}
            onConfirm={deleteReview}
            onClose={() => setDeleteReviewTarget("")}
          />
        </div>
      )}
    </main>
  );
};

export default ProductDetails;

