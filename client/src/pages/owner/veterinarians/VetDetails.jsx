import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Star } from "lucide-react";

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
  toArray,
  vetName,
} from "../ownerShared";

const VetDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedAppointmentId = searchParams.get("appointmentId") || "";
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [vet, setVet] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    appointmentId: "",
    rating: 5,
    comment: "",
  });
  const [editingReviewId, setEditingReviewId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteReviewTarget, setDeleteReviewTarget] = useState("");
  const [deleteReviewBusy, setDeleteReviewBusy] = useState(false);

  const load = async () => {
    const [vetRes, availabilityRes, reviewsRes, appointmentsRes] = await Promise.all([
      api.get(`/vets/${id}`),
      api.get(`/vets/${id}/availability`).catch(() => ({ data: { availability: [] } })),
      api.get(`/reviews/vet/${id}`).catch(() => ({ data: [] })),
      api.get("/appointments?status=completed&limit=50").catch(() => ({ data: [] })),
    ]);
    const nextVet = vetRes.data.vet || vetRes.data.veterinarian || vetRes.data;
    const nextAppointments = toArray(appointmentsRes.data, ["appointments"]);
    setVet(nextVet);
    setAvailability(availabilityRes.data.availability || nextVet.availability || []);
    setReviews(toArray(reviewsRes.data, ["reviews"]));
    setAppointments(nextAppointments);

    if (
      requestedAppointmentId &&
      nextAppointments.some((appointment) => getId(appointment) === requestedAppointmentId)
    ) {
      setReviewForm((current) => ({
        ...current,
        appointmentId: requestedAppointmentId,
      }));
    }
  };

  const { loading, error } = useFetch(load, id);

  const completedVetAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "completed" &&
      (getId(appointment.vetId) === id || appointment.vetId === id)
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
        await api.post("/reviews/vet", {
          vetId: id,
          appointmentId: reviewForm.appointmentId,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        });
        toast.success("Review added");
      }
      setReviewForm({ appointmentId: "", rating: 5, comment: "" });
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
      appointmentId: getId(review.appointmentId) || review.appointmentId || "",
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

  if (loading) return <Loader label="Loading veterinarian" />;

  return (
    <main>
      <PageHeader
        title={vetName(vet)}
        description={vet?.specialization || "Veterinarian profile"}
        actions={
          <Button as={Link} to={`/owner/appointments/book?vetId=${id}`}>
            Book Appointment
          </Button>
        }
      />
      <ErrorState message={error} />
      {!vet ? (
        <EmptyState title="Veterinarian not found" />
      ) : (
        <div className="space-y-6">
          <Panel className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <img
              src={itemImage(vet) || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"}
              alt={vetName(vet)}
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Clinic" value={vet.clinicName} />
              <InfoBlock label="Qualification" value={vet.qualification} />
              <InfoBlock label="Experience" value={`${vet.experience || 0} years`} />
              <InfoBlock label="Fee" value={money(vet.consultationFee)} />
              <InfoBlock label="Rating" value={`${Number(vet.averageRating || 0).toFixed(1)} / 5`} />
              <InfoBlock label="Reviews" value={vet.totalReviews || reviews.length} />
              <InfoBlock label="Phone" value={vet.userId?.phone || vet.phone} />
              <InfoBlock label="Email" value={vet.userId?.email || vet.email} />
            </div>
          </Panel>

          <Panel id="vet-reviews">
            <h2 className="mb-4 text-xl font-bold text-white">Availability</h2>
            {availability.length === 0 ? (
              <EmptyState title="No availability added" description="Availability will appear here when the veterinarian updates it." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availability.map((slot) => (
                  <div
                    key={`${slot.day}-${slot.startTime}-${slot.endTime}`}
                    className="rounded-xl border border-white/10 bg-slate-950 p-4"
                  >
                    <p className="font-semibold text-white">{slot.day}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {slot.isAvailable ? `${slot.startTime} - ${slot.endTime}` : "Not available"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Veterinarian Reviews</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {Number(vet.averageRating || 0).toFixed(1)} out of 5 from {vet.totalReviews || reviews.length} reviews
                </p>
              </div>
              <div className="flex items-center gap-1 text-amber-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= Math.round(vet.averageRating || 0) ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>

            {completedVetAppointments.length > 0 && (!ownerReview || editingReviewId) && (
              <form
                onSubmit={saveReview}
                className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-[1fr_160px]"
              >
                {!editingReviewId && (
                  <Field
                    label="Appointment"
                    as="select"
                    value={reviewForm.appointmentId}
                    onChange={(value) => setReviewForm({ ...reviewForm, appointmentId: value })}
                    options={[
                      { value: "", label: "Select completed appointment" },
                      ...completedVetAppointments.map((appointment) => ({
                        value: getId(appointment),
                        label: `${formatDate(appointment.appointmentDate)} at ${appointment.appointmentTime}`,
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
                    placeholder="Share how the consultation went"
                    required
                  />
                </div>
                <div className="flex gap-3 md:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingReviewId ? "Update Review" : "Add Review"}
                  </Button>
                  {editingReviewId && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingReviewId("");
                        setReviewForm({ appointmentId: "", rating: 5, comment: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}

            {completedVetAppointments.length === 0 && !ownerReview && (
              <div className="mb-6 rounded-xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                You can review this veterinarian after a completed appointment.
              </div>
            )}

            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" description="Owner reviews for this veterinarian will appear here." />
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
                      <p className="mt-3 text-sm leading-6 text-slate-400">{review.comment}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
          <ConfirmDialog
            open={Boolean(deleteReviewTarget)}
            title="Delete review"
            message="This veterinarian review will be removed."
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

export default VetDetails;

