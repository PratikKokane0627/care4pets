import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

import EmptyState from "../../../components/owner/EmptyState";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import {
  Button,
  ErrorState,
  Field,
  Panel,
  formatDate,
  getId,
  petName,
  toArray,
} from "../ownerShared";

const initialForm = {
  petId: "",
  vaccineName: "",
  doseNumber: 1,
  vaccinationDate: "",
  nextDueDate: "",
  clinicName: "",
  status: "completed",
  notes: "",
};

const Vaccinations = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [view, setView] = useState("all");

  const load = async () => {
    const vaccinationEndpoint =
      view === "upcoming"
        ? "/vaccinations/upcoming"
        : view === "overdue"
          ? "/vaccinations/overdue"
          : "/vaccinations";
    const [vaccinationRes, petRes] = await Promise.all([
      api.get(vaccinationEndpoint),
      api.get("/pets"),
    ]);
    setVaccinations(toArray(vaccinationRes.data, ["vaccinations"]));
    setPets(toArray(petRes.data, ["pets"]));
  };

  const { loading, error } = useFetch(load, `vaccinations-${view}`);

  const save = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/vaccinations/${editingId}`, form);
      toast.success("Vaccination updated");
    } else {
      await api.post("/vaccinations", form);
      toast.success("Vaccination added");
    }
    setForm(initialForm);
    setEditingId("");
    setShowForm(false);
    await load();
  };

  const edit = (item) => {
    setEditingId(getId(item));
    setForm({
      ...initialForm,
      ...item,
      petId: getId(item.petId) || item.petId || "",
      vaccinationDate: item.vaccinationDate?.slice?.(0, 10) || "",
      nextDueDate: item.nextDueDate?.slice?.(0, 10) || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(initialForm);
    setEditingId("");
    setShowForm(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this vaccination record?")) return;
    await api.delete(`/vaccinations/${id}`);
    toast.success("Vaccination deleted");
    await load();
  };

  return (
    <main>
      <PageHeader
        title="Vaccinations"
        description="Add records, track upcoming doses and review reminders."
        action={<Button onClick={() => { setEditingId(""); setForm(initialForm); setShowForm(true); }}><Plus size={17} /> Add Record</Button>}
      />
      <ErrorState message={error} />
      <Panel>
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Records" },
            { value: "upcoming", label: "Upcoming" },
            { value: "overdue", label: "Overdue" },
          ].map((item) => (
            <Button
              key={item.value}
              variant={view === item.value ? "primary" : "ghost"}
              onClick={() => setView(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {showForm && (
          <form
            onSubmit={save}
            className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2"
          >
            <Field
              label="Pet"
              as="select"
              value={form.petId}
              onChange={(value) => setForm({ ...form, petId: value })}
              options={[
                { value: "", label: "Select pet" },
                ...pets.map((pet) => ({ value: getId(pet), label: petName(pet) })),
              ]}
              required
            />
            <Field label="Vaccine" value={form.vaccineName} onChange={(value) => setForm({ ...form, vaccineName: value })} required />
            <Field label="Dose" type="number" value={form.doseNumber} onChange={(value) => setForm({ ...form, doseNumber: value })} />
            <Field label="Vaccination date" type="date" value={form.vaccinationDate} onChange={(value) => setForm({ ...form, vaccinationDate: value })} />
            <Field label="Next due" type="date" value={form.nextDueDate} onChange={(value) => setForm({ ...form, nextDueDate: value })} />
            <Field label="Clinic" value={form.clinicName} onChange={(value) => setForm({ ...form, clinicName: value })} />
            <Field className="md:col-span-2" label="Notes" as="textarea" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit">{editingId ? "Update Record" : "Save Record"}</Button>
              <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        )}
        {loading ? (
          <EmptyState title="Loading vaccinations" description="Fetching vaccination records." />
        ) : vaccinations.length === 0 ? (
          <EmptyState title="No records" description="Add your first vaccination record." />
        ) : (
          <div className="space-y-4">
            {vaccinations.map((item) => (
              <article
                key={getId(item)}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-slate-950"
              >
                <div>
                  <h2 className="font-bold text-white">{item.vaccineName}</h2>
                  <p className="text-sm text-slate-400">
                    {petName(item.petId)} - next due {formatDate(item.nextDueDate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.clinicName}
                    {item.daysRemaining !== undefined && ` - ${item.daysRemaining} days remaining`}
                    {item.overdueDays !== undefined && ` - ${item.overdueDays} days overdue`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={item.calculatedStatus || item.status} />
                  <Button variant="ghost" onClick={() => edit(item)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="danger" onClick={() => remove(getId(item))}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </main>
  );
};

export default Vaccinations;
