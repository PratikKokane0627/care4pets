import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, PawPrint, Plus, Trash2 } from "lucide-react";

import EmptyState from "../../../components/owner/EmptyState";
import PageHeader from "../../../components/owner/PageHeader";
import PetCard from "../../../components/owner/PetCard";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  Panel,
  SearchBox,
  getId,
  initialPetForm,
  itemImage,
  toArray,
} from "../ownerShared";

const speciesOptions = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"].map(
  (value) => ({ value, label: value })
);
const genderOptions = ["Male", "Female"].map((value) => ({ value, label: value }));

const MyPets = ({ defaultShowForm = false }) => {
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialPetForm);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(defaultShowForm);
  const [petImageFile, setPetImageFile] = useState(null);
  const [petImagePreview, setPetImagePreview] = useState("");
  const [petImageBusy, setPetImageBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const navigate = useNavigate();

  const loadPets = async () => {
    const res = await api.get("/pets");
    setPets(toArray(res.data, ["pets"]));
  };
  const { loading, error } = useFetch(loadPets);

  const visiblePets = pets.filter((pet) =>
    [pet.petName, pet.species, pet.breed]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openForm = (pet) => {
    setEditingId(getId(pet) || "");
    setForm(
      pet
        ? {
            ...initialPetForm,
            ...pet,
            dateOfBirth: pet.dateOfBirth?.slice?.(0, 10) || "",
          }
        : initialPetForm
    );
    setPetImageFile(null);
    setPetImagePreview(pet ? itemImage(pet) : "");
    setShowForm(true);
  };

  const updatePetInList = (updatedPet) => {
    setPets((previous) =>
      previous.map((pet) => (getId(pet) === getId(updatedPet) ? updatedPet : pet))
    );
  };

  const choosePetImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPetImageFile(file);
    setPetImagePreview(URL.createObjectURL(file));
  };

  const uploadPetImage = async (petId) => {
    if (!petImageFile) return null;
    const formData = new FormData();
    formData.append("image", petImageFile);
    const res = await api.put(`/pets/${petId}/image`, formData);
    const updatedPet = res.data.pet || res.data;
    updatePetInList(updatedPet);
    setPetImagePreview(itemImage(updatedPet));
    setPetImageFile(null);
    return updatedPet;
  };

  const deletePetImage = async () => {
    if (petImageFile && !editingId) {
      setPetImageFile(null);
      setPetImagePreview("");
      return;
    }
    if (!editingId || !petImagePreview) return toast.error("No pet image to delete");
    setConfirmAction({
      type: "pet-image",
      title: "Delete pet image",
      message: "This will remove the current profile image from this pet.",
      confirmText: "Delete Image",
    });
  };

  const confirmPetAction = async () => {
    if (!confirmAction) return;
    setConfirmBusy(true);
    try {
      if (confirmAction.type === "pet-image") {
        setPetImageBusy(true);
        const res = await api.delete(`/pets/${editingId}/image`);
        updatePetInList(res.data.pet || res.data);
        setPetImagePreview("");
        setPetImageFile(null);
        toast.success(res.data.message || "Pet image deleted");
      } else if (confirmAction.type === "pet-profile") {
        await api.delete(`/pets/${confirmAction.id}`);
        toast.success("Pet deleted");
        await loadPets();
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete pet");
    } finally {
      setPetImageBusy(false);
      setConfirmBusy(false);
    }
  };

  const savePet = async (event) => {
    event.preventDefault();
    setPetImageBusy(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        weight: Number(form.weight),
      };
      const res = editingId
        ? await api.put(`/pets/${editingId}`, payload)
        : await api.post("/pets", payload);
      const savedPet = res.data.pet || res.data;
      if (petImageFile) await uploadPetImage(getId(savedPet));
      toast.success(editingId ? "Pet updated" : "Pet added");
      setShowForm(false);
      setPetImageFile(null);
      setPetImagePreview("");
      await loadPets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save pet");
    } finally {
      setPetImageBusy(false);
    }
  };

  const deletePet = async (id) => {
    setConfirmAction({
      type: "pet-profile",
      id,
      title: "Delete pet profile",
      message: "This will permanently delete this pet profile.",
      confirmText: "Delete Pet",
    });
  };

  return (
    <main>
      <PageHeader
        title="My Pets"
        description="List, search, add, view details, edit and  delete your pet profiles."
        action={<Button onClick={() => openForm()}><Plus size={17} /> Add Pet</Button>}
      />
      <ErrorState message={error} />
      <Panel>
        <div className="mb-5">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search pets by name, species or breed"
          />
        </div>
        {showForm && (
          <form
            onSubmit={savePet}
            className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2"
          >
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 md:col-span-2">
              <p className="mb-3 text-sm font-semibold text-white">Pet Image</p>
              <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-cyan-300">
                  {petImagePreview ? (
                    <img
                      src={petImagePreview}
                      alt={form.petName || "Pet"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PawPrint size={42} />
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <Camera size={17} />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={choosePetImage}
                    />
                  </label>
                  <Button
                    variant="danger"
                    disabled={!petImagePreview || petImageBusy}
                    onClick={deletePetImage}
                  >
                    <Trash2 size={16} />
                    Delete Image
                  </Button>
                </div>
              </div>
            </div>
            <Field label="Pet name" value={form.petName} onChange={(v) => setForm({ ...form, petName: v })} required />
            <Field label="Species" as="select" value={form.species} onChange={(v) => setForm({ ...form, species: v })} options={speciesOptions} />
            <Field label="Breed" value={form.breed} onChange={(v) => setForm({ ...form, breed: v })} required />
            <Field label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} required />
            <Field label="Gender" as="select" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={genderOptions} />
            <Field label="Weight" type="number" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} required />
            <Field label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
            <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <Field className="md:col-span-2" label="Medical history" as="textarea" value={form.medicalHistory} onChange={(v) => setForm({ ...form, medicalHistory: v })} />
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={petImageBusy}>
                {petImageBusy ? "Saving..." : editingId ? "Update Pet" : "Save Pet"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}
        {loading ? (
          <EmptyState title="Loading pets" description="Fetching your pet profiles." />
        ) : visiblePets.length === 0 ? (
          <EmptyState
            title="No pets found"
            description="Add your first pet profile to begin."
            action={<Button onClick={() => openForm()}><Plus size={17} /> Add Pet</Button>}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePets.map((pet) => (
              <PetCard
                key={getId(pet)}
                pet={pet}
                ActionButton={Button}
                onDetails={(petId) => navigate(`/owner/pets/${petId}`)}
                onEdit={openForm}
                onDelete={deletePet}
              />
            ))}
            <button
              type="button"
              onClick={() => openForm()}
              className="flex min-h-[430px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950/35 p-6 text-center transition hover:border-cyan-300/60 hover:bg-cyan-400/5"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-cyan-300"><Plus size={30} /></span>
              <span className="mt-5 text-lg font-semibold text-white">Add Pet</span>
              <span className="mt-2 max-w-44 text-sm leading-6 text-slate-500">Register a new pet profile</span>
            </button>
          </div>
        )}
      </Panel>
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        danger
        loading={confirmBusy}
        onConfirm={confirmPetAction}
        onClose={() => setConfirmAction(null)}
      />
    </main>
  );
};

export default MyPets;
