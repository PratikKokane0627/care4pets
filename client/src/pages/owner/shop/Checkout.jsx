import { useState } from "react";
import { toast } from "react-hot-toast";

import PageHeader from "../../../components/owner/PageHeader";
import api from "../../../services/api";
import { Button, Field, Panel, notifyOwnerShopCounts } from "../ownerShared";

const Checkout = () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: storedUser.name || "",
    phone: storedUser.phone || "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const setField = (field, value) => setShipping((current) => ({ ...current, [field]: value }));

  const placeOrder = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/orders", { shippingAddress: shipping, paymentMethod: "COD" });
      toast.success("Order placed");
      notifyOwnerShopCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <PageHeader title="Checkout" description="Cash on delivery checkout for pet shop orders." />
      <Panel>
        <form onSubmit={placeOrder} className="grid gap-5 md:grid-cols-2">
          {Object.entries(shipping).map(([field, value]) => (
            <Field key={field} label={field.replace(/([A-Z])/g, " $1")} value={value} onChange={(next) => setField(field, next)} required />
          ))}
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Placing..." : "Place COD Order"}</Button>
          </div>
        </form>
      </Panel>
    </main>
  );
};

export default Checkout;

