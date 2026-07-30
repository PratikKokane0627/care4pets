import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Edit3, Eye, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";

import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminLoader from "../../components/admin/AdminLoader";
import EmptyState from "../../components/admin/EmptyState";
import StatusBadge from "../../components/admin/StatusBadge";
import DetailGrid from "../../components/admin/DetailGrid";
import FilterPanel from "../../components/admin/FilterPanel";
import FormPage from "../../components/admin/FormPage";
import FutureModule from "../../components/admin/FutureModule";
import ImageUploader from "../../components/admin/ImageUploader";
import ReportPanel from "../../components/admin/ReportPanel";
import ResourceShell from "../../components/admin/ResourceShell";
import SearchBar from "../../components/admin/SearchBar";
import api from "../../services/api";
import {
  Button,
  ErrorState,
  Field,
  InfoBlock,
  Panel,
  formatDate,
  getId,
  imageUrl,
  money,
  toArray,
  userName,
} from "./adminShared";

const orderStatuses = ["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const groomingStatuses = ["pending", "accepted", "rejected", "cancelled", "completed"];

const useSingle = (endpoint, key) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(endpoint);
        if (mounted) setData(key ? res.data[key] : res.data);
      } catch (err) {
        const message = err.response?.data?.message || "Could not load details";
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [endpoint, key]);

  return { data, loading, error, setData };
};

export const Users = () => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const endpoint = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (role) p.set("role", role);
    if (status) p.set("status", status);
    return `/admin/users?${p}`;
  }, [role, search, status]);

  const updateStatus = async (user, nextStatus, refresh) => {
    await api.patch(`/admin/users/${getId(user)}/status`, { status: nextStatus });
    toast.success("User status updated");
    refresh();
  };

  const remove = async (user, refresh) => {
    if (!window.confirm(`Delete ${userName(user)}?`)) return;
    await api.delete(`/admin/users/${getId(user)}`);
    toast.success("User deleted");
    refresh();
  };

  return (
    <ResourceShell
      title="Users"
      description="Manage owners, vets, groomers and admins."
      endpoint={endpoint}
      keys={["users"]}
      filters={({ setPage }) => (
        <FilterPanel>
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email or phone" />
          <Field as="select" label="Role" value={role} onChange={(v) => { setRole(v); setPage(1); }} options={[{ value: "", label: "All roles" }, "owner", "vet", "groomer", "admin".split()].flat().map((value) => typeof value === "string" ? { value, label: value || "All roles" } : value)} />
          <Field as="select" label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, "pending", "active", "inactive", "blocked", "rejected"].map((value) => typeof value === "string" ? { value, label: value || "All statuses" } : value)} />
          <div className="flex items-end"><Button variant="ghost" onClick={() => { setSearch(""); setRole(""); setStatus(""); setPage(1); }}>Reset</Button></div>
        </FilterPanel>
      )}
      columns={() => [
        { header: "User", render: (user) => <><p className="font-semibold text-white">{userName(user)}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></> },
        { header: "Phone", render: (user) => user.phone || "Not set" },
        { header: "Role", render: (user) => <span className="capitalize">{user.role}</span> },
        { header: "Status", render: (user) => <StatusBadge status={user.status || "active"} /> },
        { header: "Joined", render: (user) => formatDate(user.createdAt) },
        { header: "Actions", render: (user) => <div className="flex flex-wrap gap-2"><Button as={Link} to={`/admin/users/${getId(user)}`} variant="ghost"><Eye size={15} /> View</Button><Button variant="success" onClick={() => updateStatus(user, "active", refresh)}>Active</Button><Button variant="danger" onClick={() => updateStatus(user, "blocked", refresh)}>Block</Button><Button variant="danger" onClick={() => remove(user, refresh)}><Trash2 size={15} /></Button></div> },
      ]}
      emptyTitle="No users found"
      emptyDescription="User accounts will appear here."
    />
  );
};

export const UserDetails = () => {
  const { id } = useParams();
  const { data, loading, error, setData } = useSingle(`/admin/users/${id}`, null);
  const navigate = useNavigate();
  if (loading) return <AdminLoader text="Loading user details..." />;
  const user = data?.user;
  if (!user) return <EmptyState title="User not found" description={error} />;
  const updateStatus = async (status) => {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    setData((current) => ({ ...current, user: res.data.user }));
    toast.success("User status updated");
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${userName(user)}?`)) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("User deleted");
    navigate("/admin/users");
  };
  return (
    <main>
      <AdminPageHeader title={userName(user)} description="Profile, role, account status and admin actions." actions={<><Button variant="success" onClick={() => updateStatus("active")}>Activate</Button><Button variant="danger" onClick={() => updateStatus("blocked")}>Block</Button><Button variant="danger" onClick={remove}>Delete</Button></>} />
      <ErrorState message={error} />
      <Panel className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="Email" value={user.email} />
        <InfoBlock label="Phone" value={user.phone} />
        <InfoBlock label="Role" value={user.role} />
        <InfoBlock label="Status" value={<StatusBadge status={user.status} />} />
        <InfoBlock label="Joined" value={formatDate(user.createdAt)} />
        <InfoBlock label="Address" value={[user.address?.street, user.address?.city, user.address?.state, user.address?.zipCode].filter(Boolean).join(", ")} />
      </Panel>
      <Panel className="mt-5">
        <h2 className="text-lg font-bold text-white">User Activity</h2>
        <p className="mt-2 text-sm text-slate-400">Pets, bookings and orders need dedicated activity APIs. This panel is ready for those endpoints later.</p>
      </Panel>
    </main>
  );
};

export const ManageVets = () => {
  const [status, setStatus] = useState("");
  const endpoint = status ? `/admin/vets?status=${status}` : "/admin/vets?";
  const setApproval = async (vet, action, refresh) => {
    await api.patch(`/admin/vets/${getId(vet)}/${action}`);
    toast.success(action === "approve" ? "Veterinarian approved" : "Veterinarian rejected");
    refresh();
  };
  return (
    <ResourceShell
      title="Veterinarians"
      description="Review registered veterinarians and approval status."
      endpoint={endpoint}
      keys={["vets"]}
      filters={({ setPage }) => <FilterPanel><Field as="select" label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, "pending", "approved", "rejected"].map((value) => typeof value === "string" ? { value, label: value || "All statuses" } : value)} /></FilterPanel>}
      columns={() => [
        { header: "Vet", render: (vet) => <><p className="font-semibold text-white">{userName(vet.userId)}</p><p className="mt-1 text-xs text-slate-500">{vet.userId?.email}</p></> },
        { header: "Specialization", render: (vet) => vet.specialization || "Not set" },
        { header: "Experience", render: (vet) => `${vet.experience || 0} years` },
        { header: "Fee", render: (vet) => money(vet.consultationFee) },
        { header: "Status", render: (vet) => <StatusBadge status={vet.status} /> },
        { header: "Actions", render: (vet) => <div className="flex flex-wrap gap-2"><Button as={Link} to={`/admin/veterinarians/${getId(vet)}`} variant="ghost">View</Button><Button variant="success" onClick={() => setApproval(vet, "approve", refresh)}>Approve</Button><Button variant="danger" onClick={() => setApproval(vet, "reject", refresh)}>Reject</Button></div> },
      ]}
      emptyTitle="No veterinarians found"
    />
  );
};

export const Pets = () => {
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const endpoint = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (species) p.set("species", species);
    return `/admin/pets?${p}`;
  }, [search, species]);

  return (
    <ResourceShell
      title="Pets"
      description="View registered pets, owners, health records and vaccination status."
      endpoint={endpoint}
      keys={["pets"]}
      filters={({ setPage }) => (
        <FilterPanel>
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search pets, species or breed" />
          <Field as="select" label="Species" value={species} onChange={(v) => { setSpecies(v); setPage(1); }} options={[{ value: "", label: "All species" }, ...["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"].map((v) => ({ value: v, label: v }))]} />
        </FilterPanel>
      )}
      columns={() => [
        { header: "Pet", render: (pet) => <><p className="font-semibold text-white">{pet.petName}</p><p className="mt-1 text-xs text-slate-500">{pet.breed} - {pet.species}</p></> },
        { header: "Owner", render: (pet) => <><p>{userName(pet.ownerId)}</p><p className="mt-1 text-xs text-slate-500">{pet.ownerId?.email}</p></> },
        { header: "Age", render: (pet) => `${pet.age || 0} years` },
        { header: "Vaccination", render: (pet) => <StatusBadge status={pet.vaccinationStatus || "Pending"} /> },
        { header: "Actions", render: (pet) => <Button as={Link} to={`/admin/pets/${getId(pet)}`} variant="ghost">View</Button> },
      ]}
      emptyTitle="No pets found"
    />
  );
};

export const PetDetails = () => {
  const { id } = useParams();
  const { data, loading, error } = useSingle(`/admin/pets/${id}`, null);
  if (loading) return <AdminLoader text="Loading pet..." />;
  if (!data?.pet) return <EmptyState title="Pet not found" description={error} />;
  const pet = data.pet;
  return (
    <main>
      <AdminPageHeader title={pet.petName} description="Pet owner, medical history and vaccinations." />
      <Panel className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="Owner" value={userName(pet.ownerId)} />
        <InfoBlock label="Species" value={pet.species} />
        <InfoBlock label="Breed" value={pet.breed} />
        <InfoBlock label="Age" value={`${pet.age || 0} years`} />
        <InfoBlock label="Gender" value={pet.gender} />
        <InfoBlock label="Weight" value={`${pet.weight || 0} kg`} />
        <InfoBlock label="Vaccination" value={<StatusBadge status={pet.vaccinationStatus} />} />
        <InfoBlock label="Medical History" value={pet.medicalHistory} />
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <ReportPanel title="Recent Medical Visits" rows={(data.medicalHistory || []).map((item) => ({ _id: item.reason || "Visit", count: formatDate(item.appointmentDate) }))} />
        <ReportPanel title="Vaccinations" rows={(data.vaccinations || []).map((item) => ({ _id: item.vaccineName, count: item.status }))} />
      </div>
    </main>
  );
};

export const VetDetails = () => {
  const { id } = useParams();
  const { data, loading, error } = useSingle(`/admin/vets/${id}`, "vet");
  if (loading) return <AdminLoader text="Loading veterinarian..." />;
  const vet = data;
  if (!vet) return <EmptyState title="Veterinarian not found" description={error} />;
  const clinicAddress = vet.clinicAddress
    ? [vet.clinicAddress.street, vet.clinicAddress.city, vet.clinicAddress.state, vet.clinicAddress.zipCode].filter(Boolean).join(", ")
    : "";
  return (
    <main>
      <AdminPageHeader title={userName(vet.userId) || "Veterinarian"} description="Qualification, clinic and approval information." />
      <Panel className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="Email" value={vet.userId?.email} />
        <InfoBlock label="Specialization" value={vet.specialization} />
        <InfoBlock label="Experience" value={`${vet.experience || 0} years`} />
        <InfoBlock label="Clinic" value={vet.clinicName} />
        <InfoBlock label="Fee" value={money(vet.consultationFee)} />
        <InfoBlock label="Status" value={<StatusBadge status={vet.status} />} />
        <InfoBlock label="Address" value={clinicAddress || vet.address} />
        <InfoBlock label="Bio" value={vet.about || vet.bio} />
      </Panel>
    </main>
  );
};

export const ManageGroomers = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const endpoint = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status) p.set("status", status);
    return `/admin/groomers?${p}`;
  }, [search, status]);
  const updateStatus = async (groomer, nextStatus, refresh) => {
    await api.patch(`/admin/groomers/${getId(groomer)}/status`, { status: nextStatus });
    toast.success("Groomer status updated");
    refresh();
  };
  return (
    <ResourceShell
      title="Groomers"
      description="Create and manage grooming provider accounts."
      action={<Button as={Link} to="/admin/groomers/add"><Plus size={16} /> Add Groomer</Button>}
      endpoint={endpoint}
      keys={["groomers"]}
      filters={({ setPage }) => <FilterPanel><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search groomers" /><Field as="select" label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, "active", "inactive", "blocked"].map((value) => typeof value === "string" ? { value, label: value || "All statuses" } : value)} /></FilterPanel>}
      columns={({ refresh }) => [
        { header: "Groomer", render: (user) => <><p className="font-semibold text-white">{userName(user)}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></> },
        { header: "Phone", render: (user) => user.phone },
        { header: "Status", render: (user) => <StatusBadge status={user.status} /> },
        { header: "Joined", render: (user) => formatDate(user.createdAt) },
        { header: "Actions", render: (user) => <div className="flex flex-wrap gap-2"><Button as={Link} to={`/admin/groomers/${getId(user)}`} variant="ghost">View</Button><Button variant="success" onClick={() => updateStatus(user, "active", refresh)}>Active</Button><Button variant="danger" onClick={() => updateStatus(user, "blocked", refresh)}>Block</Button></div> },
      ]}
      emptyTitle="No groomers found"
    />
  );
};

export const AddGroomer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", bio: "", experience: "", skills: "", serviceAreas: "" });
  const save = async (event) => {
    event.preventDefault();
    await api.post("/admin/groomers", { ...form, skills: form.skills.split(",").map((v) => v.trim()).filter(Boolean), serviceAreas: form.serviceAreas.split(",").map((v) => v.trim()).filter(Boolean) });
    toast.success("Groomer created");
    navigate("/admin/groomers");
  };
  return <FormPage title="Add Groomer" description="Create a groomer account." form={form} setForm={setForm} onSubmit={save} fields={["name", "email", "phone", "password", "bio", "experience", "skills", "serviceAreas"]} />;
};

export const EditGroomer = () => <FutureModule icon={Lock} title="Edit Groomer" description="Groomer edit UI is reserved until update-profile admin APIs are added." bullets={["Contact details", "Service profile", "Availability", "Service areas"]} />;

export const GroomerDetails = () => {
  const { id } = useParams();
  const { data, loading, error } = useSingle(`/admin/users/${id}`, null);
  if (loading) return <AdminLoader text="Loading groomer..." />;
  const user = data?.user;
  if (!user) return <EmptyState title="Groomer not found" description={error} />;
  return <DetailGrid title={userName(user)} description="Groomer account details." values={{ Email: user.email, Phone: user.phone, Status: user.status, Joined: formatDate(user.createdAt) }} />;
};

export const ManageAppointments = () => {
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const endpoint = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (date) {
      p.set("startDate", date);
      p.set("endDate", date);
    }
    return `/admin/appointments?${p}`;
  }, [date, status]);
  const updateAppointment = async (appointment, refresh) => {
    const nextStatus = window.prompt(
      "Status: pending, accepted, rejected, cancelled, completed",
      appointment.status || "accepted"
    );
    if (!nextStatus) return;
    await api.patch(`/admin/appointments/${getId(appointment)}`, { status: nextStatus });
    toast.success("Appointment updated");
    refresh();
  };
  return (
    <ResourceShell
      title="Appointments"
      description="Review all veterinary appointments."
      endpoint={endpoint}
      keys={["appointments"]}
      filters={({ setPage }) => <FilterPanel><Field as="select" label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, "pending", "accepted", "rejected", "cancelled", "completed"].map((value) => typeof value === "string" ? { value, label: value || "All statuses" } : value)} /><Field label="Date" type="date" value={date} onChange={(v) => { setDate(v); setPage(1); }} /></FilterPanel>}
      columns={() => [
        { header: "Pet", render: (a) => a.petId?.petName || a.petId?.name || "Pet" },
        { header: "Owner", render: (a) => userName(a.ownerId) },
        { header: "Vet", render: (a) => userName(a.vetId?.userId) },
        { header: "Date", render: (a) => `${formatDate(a.appointmentDate)} ${a.appointmentTime || ""}` },
        { header: "Status", render: (a) => <StatusBadge status={a.status} /> },
        { header: "Actions", render: (a) => <div className="flex flex-wrap gap-2"><Button as={Link} to={`/admin/appointments/${getId(a)}`} variant="ghost">View</Button><Button onClick={() => updateAppointment(a, refresh)}>Status</Button></div> },
      ]}
      emptyTitle="No appointments found"
    />
  );
};

export const AppointmentDetails = () => {
  const { id } = useParams();
  const { data, loading, error, setData } = useSingle(`/appointments/${id}`, "appointment");
  if (loading) return <AdminLoader text="Loading appointment..." />;
  const a = data;
  if (!a) return <EmptyState title="Appointment not found" description={error} />;
  const update = async () => {
    const status = window.prompt("Status: pending, accepted, rejected, cancelled, completed", a.status);
    if (!status) return;
    const res = await api.patch(`/admin/appointments/${id}`, { status });
    setData(res.data.appointment);
    toast.success("Appointment updated");
  };
  const reschedule = async () => {
    const appointmentDate = window.prompt("New date (YYYY-MM-DD)", a.appointmentDate?.slice?.(0, 10) || "");
    if (!appointmentDate) return;
    const appointmentTime = window.prompt("New time (HH:mm)", a.appointmentTime || "");
    if (!appointmentTime) return;
    const res = await api.patch(`/admin/appointments/${id}`, { appointmentDate, appointmentTime });
    setData(res.data.appointment);
    toast.success("Appointment rescheduled");
  };
  return <main><AdminPageHeader title="Appointment Details" description="Owner, pet, vet and visit information." actions={<><Button onClick={update}>Update Status</Button><Button variant="ghost" onClick={reschedule}>Reschedule</Button></>} /><Panel className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><InfoBlock label="Pet" value={a.petId?.petName} /><InfoBlock label="Owner" value={userName(a.ownerId)} /><InfoBlock label="Veterinarian" value={userName(a.vetId?.userId)} /><InfoBlock label="Date" value={formatDate(a.appointmentDate)} /><InfoBlock label="Time" value={a.appointmentTime} /><InfoBlock label="Status" value={<StatusBadge status={a.status} />} /><InfoBlock label="Reason" value={a.reason} /><InfoBlock label="Notes" value={a.notes} /><InfoBlock label="Diagnosis" value={a.diagnosis} /><InfoBlock label="Prescription" value={a.prescription} /></Panel></main>;
};

export const Categories = () => {
  const remove = async (category, refresh) => {
    if (!window.confirm(`Delete ${category.categoryName}?`)) return;
    await api.delete(`/categories/${getId(category)}`);
    toast.success("Category deleted");
    refresh();
  };
  return <ResourceShell title="Categories" description="Manage shop categories." action={<Button as={Link} to="/admin/categories/add"><Plus size={16} /> Add Category</Button>} endpoint="/categories?" keys={["categories"]} columns={({ refresh }) => [{ header: "Category", render: (c) => <div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-slate-950">{imageUrl(c) ? <img src={imageUrl(c)} alt={c.categoryName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No img</div>}</div><div><p className="font-semibold text-white">{c.categoryName}</p><p className="mt-1 text-xs text-slate-500">{c.description}</p></div></div> }, { header: "Created", render: (c) => formatDate(c.createdAt) }, { header: "Actions", render: (c) => <div className="flex gap-2"><Button as={Link} to={`/admin/categories/${getId(c)}/edit`} variant="ghost"><Edit3 size={15} /> Edit</Button><Button variant="danger" onClick={() => remove(c, refresh)}><Trash2 size={15} /></Button></div> }]} emptyTitle="No categories found" />;
};

export const CategoryForm = ({ edit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ categoryName: "", description: "" });
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const selectedPreview = useMemo(() => (image ? URL.createObjectURL(image) : ""), [image]);

  useEffect(() => {
    if (!edit) return;
    api.get(`/categories/${id}`).then((res) => {
      const category = res.data.category;
      setForm({
        categoryName: category?.categoryName || "",
        description: category?.description || "",
      });
      setCurrentImage(category?.image?.url ? category.image : null);
    });
  }, [edit, id]);

  useEffect(() => () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
  }, [selectedPreview]);

  const save = async (event) => {
    event.preventDefault();
    try {
      const res = edit ? await api.put(`/categories/${id}`, form) : await api.post("/categories", form);
      const categoryId = id || getId(res.data.category);
      if (image && categoryId) {
        const body = new FormData();
        body.append("image", image);
        const imageRes = await api.post(`/categories/${categoryId}/upload-image`, body);
        setCurrentImage(imageRes.data.image);
      }
      toast.success(edit ? "Category updated" : "Category created");
      navigate("/admin/categories");
    } catch (err) {
      toast.error(err.response?.data?.message || "Category save failed");
    }
  };

  const deleteImage = async () => {
    if (!id || !currentImage?.url || !window.confirm("Delete this category image?")) return;
    try {
      await api.delete(`/categories/${id}/image`);
      setCurrentImage(null);
      setImage(null);
      toast.success("Category image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Category image delete failed");
    }
  };

  const previewImage = selectedPreview || currentImage?.url || "";

  return (
    <main>
      <AdminPageHeader title={edit ? "Edit Category" : "Add Category"} description="Category information and image." />
      <Panel>
        <form onSubmit={save} className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
            <p className="mb-3 text-sm font-semibold text-white">Category Image</p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
              {previewImage ? (
                <img src={previewImage} alt={form.categoryName || "Category"} className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-slate-500">No image selected</div>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {image ? `Selected: ${image.name}` : currentImage?.url ? "Current category image" : "Upload an image for this category"}
            </p>
            <div className="mt-4 grid gap-3">
              <ImageUploader value={image?.name} onChange={setImage} />
              {currentImage?.url ? (
                <Button type="button" variant="danger" onClick={deleteImage}>
                  <Trash2 size={16} /> Delete Image
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid content-start gap-5 md:grid-cols-2">
            <Field label="Category name" value={form.categoryName} onChange={(v) => setForm({ ...form, categoryName: v })} required />
            <Field className="md:col-span-2" as="textarea" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div className="md:col-span-2">
              <Button type="submit">{edit ? "Update Category" : "Create Category"}</Button>
            </div>
          </div>
        </form>
      </Panel>
    </main>
  );
};

export const Products = () => {
  const [search, setSearch] = useState("");
  const endpoint = search ? `/products?search=${encodeURIComponent(search)}` : "/products?";
  const remove = async (product, refresh) => {
    if (!window.confirm(`Delete ${product.productName}?`)) return;
    await api.delete(`/products/${getId(product)}`);
    toast.success("Product deleted");
    refresh();
  };
  return <ResourceShell title="Products" description="Manage product catalog and stock." action={<Button as={Link} to="/admin/products/add"><Plus size={16} /> Add Product</Button>} endpoint={endpoint} keys={["products"]} filters={({ setPage }) => <FilterPanel><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products or SKU" /></FilterPanel>} columns={({ refresh }) => [{ header: "Product", render: (p) => <div className="flex gap-3"><img src={imageUrl(p) || "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=80"} className="h-12 w-12 rounded-lg object-cover" /><div><p className="font-semibold text-white">{p.productName}</p><p className="text-xs text-slate-500">{p.sku}</p></div></div> }, { header: "Category", render: (p) => p.categoryId?.categoryName }, { header: "Price", render: (p) => money(p.discountPrice || p.price) }, { header: "Stock", render: (p) => <span className={p.stock <= 10 ? "font-semibold text-amber-300" : ""}>{p.stock}</span> }, { header: "Actions", render: (p) => <div className="flex flex-wrap gap-2"><Button as={Link} to={`/admin/products/${getId(p)}`} variant="ghost">View</Button><Button as={Link} to={`/admin/products/${getId(p)}/edit`} variant="ghost">Edit</Button><Button variant="danger" onClick={() => remove(p, refresh)}>Delete</Button></div> }]} emptyTitle="No products found" />;
};

export const ProductForm = ({ edit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [form, setForm] = useState({ productName: "", description: "", categoryId: "", brand: "", price: "", discountPrice: "", stock: "", sku: "", petType: "all", isFeatured: false });
  const selectedPreviews = useMemo(() => images.map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
  })), [images]);

  useEffect(() => {
    api.get("/categories?limit=100").then((res) => setCategories(toArray(res.data, ["categories"])));
    if (edit) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data.product;
        setForm({ productName: p.productName || "", description: p.description || "", categoryId: getId(p.categoryId) || "", brand: p.brand || "", price: p.price || "", discountPrice: p.discountPrice || "", stock: p.stock || "", sku: p.sku || "", petType: p.petType || "all", isFeatured: !!p.isFeatured });
        setCurrentImages(p.images || []);
      });
    }
  }, [edit, id]);

  useEffect(() => () => {
    selectedPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [selectedPreviews]);

  const save = async (event) => {
    event.preventDefault();
    if (currentImages.length + images.length > 5) {
      toast.error("A product can have a maximum of 5 images");
      return;
    }
    try {
      const payload = { ...form, price: Number(form.price), discountPrice: form.discountPrice === "" ? undefined : Number(form.discountPrice), stock: Number(form.stock), isFeatured: Boolean(form.isFeatured) };
      const res = edit ? await api.put(`/products/${id}`, payload) : await api.post("/products", payload);
      const productId = id || getId(res.data.product);
      if (images.length && productId) {
        const body = new FormData();
        images.forEach((file) => body.append("images", file));
        const imageRes = await api.post(`/products/${productId}/images`, body);
        setCurrentImages(imageRes.data.images || []);
        setImages([]);
      }
      toast.success(edit ? "Product updated" : "Product created");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Product save failed");
    }
  };

  const removeImage = async (publicId) => {
    if (!id || !publicId || !window.confirm("Remove this product image?")) return;
    try {
      const res = await api.delete(`/products/${id}/images`, { data: { publicId } });
      setCurrentImages(res.data.images || []);
      toast.success("Product image removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Product image delete failed");
    }
  };

  return (
    <main>
      <AdminPageHeader title={edit ? "Edit Product" : "Add Product"} description="Product details, inventory and images." />
      <Panel>
        <form onSubmit={save} className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
            <p className="mb-3 text-sm font-semibold text-white">Product Images</p>
            <div className="grid gap-3">
              {currentImages.length ? (
                currentImages.map((image) => (
                  <div key={image.publicId || image.url} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <img src={image.url} alt={form.productName || "Product"} className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-between gap-3 p-3">
                      <span className="truncate text-xs text-slate-500">Saved image</span>
                      <Button type="button" variant="danger" onClick={() => removeImage(image.publicId)}>
                        <Trash2 size={15} /> Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900 text-sm text-slate-500">No previous image</div>
              )}
            </div>
            {selectedPreviews.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {selectedPreviews.map((preview) => (
                  <div key={preview.url} className="overflow-hidden rounded-xl border border-cyan-300/30 bg-slate-900">
                    <img src={preview.url} alt={preview.name} className="h-24 w-full object-cover" />
                    <p className="truncate px-2 py-1 text-xs text-cyan-200">{preview.name}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4">
              <ImageUploader multiple value={images.length ? `${images.length} selected` : ""} onChange={setImages} />
            </div>
          </div>
          <div className="grid content-start gap-5 md:grid-cols-2">
            <Field label="Product name" value={form.productName} onChange={(v) => setForm({ ...form, productName: v })} required />
            <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
            <Field as="select" label="Category" value={form.categoryId} onChange={(v) => setForm({ ...form, categoryId: v })} options={[{ value: "", label: "Select category" }, ...categories.map((c) => ({ value: getId(c), label: c.categoryName }))]} required />
            <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <Field label="Price" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
            <Field label="Discount price" type="number" value={form.discountPrice} onChange={(v) => setForm({ ...form, discountPrice: v })} />
            <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} required />
            <Field as="select" label="Pet type" value={form.petType} onChange={(v) => setForm({ ...form, petType: v })} options={["all", "dog", "cat", "bird", "fish", "rabbit", "other"].map((v) => ({ value: v, label: v }))} />
            <Field as="textarea" className="md:col-span-2" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} required />
            <div className="md:col-span-2">
              <Button type="submit">{edit ? "Update Product" : "Create Product"}</Button>
            </div>
          </div>
        </form>
      </Panel>
    </main>
  );
};

export const ProductDetails = () => {
  const { id } = useParams();
  const { data, loading, error, setData } = useSingle(`/products/${id}`, "product");
  if (loading) return <AdminLoader text="Loading product..." />;
  const p = data;
  if (!p) return <EmptyState title="Product not found" description={error} />;
  const updateStock = async () => {
    const stock = Number(window.prompt("New stock quantity", p.stock));
    if (!Number.isInteger(stock) || stock < 0) return;
    const res = await api.patch(`/products/${id}/stock`, { stock });
    setData({ ...p, stock: res.data.product.stock });
    toast.success("Stock updated");
  };
  const removeImage = async (publicId) => {
    if (!publicId || !window.confirm("Remove this product image?")) return;
    const res = await api.delete(`/products/${id}/images`, { data: { publicId } });
    setData({ ...p, images: res.data.images });
    toast.success("Product image removed");
  };
  return (
    <main>
      <AdminPageHeader
        title={p.productName}
        description="Product details and inventory."
        action={<Button onClick={updateStock}>Update Stock</Button>}
      />
      <Panel className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="Category" value={p.categoryId?.categoryName} />
        <InfoBlock label="SKU" value={p.sku} />
        <InfoBlock label="Brand" value={p.brand} />
        <InfoBlock label="Price" value={money(p.price)} />
        <InfoBlock label="Discount" value={money(p.discountPrice)} />
        <InfoBlock label="Stock" value={p.stock} />
        <InfoBlock label="Featured" value={p.isFeatured ? "Yes" : "No"} />
        <InfoBlock label="Description" value={p.description} />
      </Panel>
      <Panel className="mt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">Product Images</h3>
            <p className="text-sm text-slate-400">Preview and remove uploaded product images.</p>
          </div>
          <Button as={Link} to={`/admin/products/${id}/edit`} variant="ghost">
            <Plus size={16} /> Add Images
          </Button>
        </div>
        {p.images?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {p.images.map((image) => (
              <div key={image.publicId || image.url} className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                <img src={image.url} alt={p.productName} className="h-44 w-full object-cover transition duration-300 group-hover:scale-105" />
                <div className="flex items-center justify-between gap-3 p-3">
                  <span className="truncate text-xs text-slate-400">{image.publicId || "Product image"}</span>
                  <Button type="button" variant="danger" onClick={() => removeImage(image.publicId)}>
                    <Trash2 size={15} /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No product images" description="Use edit product to upload product images." />
        )}
      </Panel>
    </main>
  );
};

export const GroomingServices = () => {
  const remove = async (service, refresh) => {
    if (!window.confirm(`Delete ${service.serviceName}?`)) return;
    await api.delete(`/grooming-services/${getId(service)}`);
    toast.success("Service deleted");
    refresh();
  };
  return <ResourceShell title="Grooming Services" description="Manage owner-bookable grooming services." action={<Button as={Link} to="/admin/grooming-services/add"><Plus size={16} /> Add Service</Button>} endpoint="/grooming-services?" keys={["services"]} columns={({ refresh }) => [{ header: "Service", render: (s) => <><p className="font-semibold text-white">{s.serviceName}</p><p className="text-xs text-slate-500">{s.description}</p></> }, { header: "Category", render: (s) => s.category }, { header: "Duration", render: (s) => `${s.duration} min` }, { header: "Price", render: (s) => money(s.price) }, { header: "Actions", render: (s) => <div className="flex gap-2"><Button as={Link} to={`/admin/grooming-services/${getId(s)}/edit`} variant="ghost">Edit</Button><Button variant="danger" onClick={() => remove(s, refresh)}>Delete</Button></div> }]} emptyTitle="No grooming services" />;
};

export const GroomingServiceForm = ({ edit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ serviceName: "", description: "", duration: "", price: "", category: "basic" });
  useEffect(() => { if (edit) api.get(`/grooming-services/${id}`).then((res) => { const s = res.data.service; setForm({ serviceName: s.serviceName || "", description: s.description || "", duration: s.duration || "", price: s.price || "", category: s.category || "basic" }); }); }, [edit, id]);
  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, duration: Number(form.duration), price: Number(form.price) };
    if (edit) {
      await api.put(`/grooming-services/${id}`, payload);
    } else {
      await api.post("/grooming-services", payload);
    }
    toast.success(edit ? "Service updated" : "Service created");
    navigate("/admin/grooming-services");
  };
  return <FormPage title={edit ? "Edit Grooming Service" : "Add Grooming Service"} description="Service name, duration and pricing." form={form} setForm={setForm} onSubmit={save} fields={[{ name: "serviceName", required: true }, { name: "category", required: true }, { name: "duration", type: "number", required: true }, { name: "price", type: "number", required: true }, { name: "description", as: "textarea", full: true }]} />;
};

export const GroomingBookings = () => {
  const [status, setStatus] = useState("");
  const endpoint = status ? `/grooming-bookings/admin/all?status=${status}` : "/grooming-bookings/admin/all?";
  const updateStatus = async (booking, refresh) => {
    const nextStatus = window.prompt("Status: pending, accepted, rejected, cancelled, completed", booking.status);
    if (!nextStatus) return;
    await api.patch(`/admin/grooming-bookings/${getId(booking)}`, { status: nextStatus });
    toast.success("Booking updated");
    refresh();
  };
  return <ResourceShell title="Grooming Bookings" description="Admin view of grooming booking requests." endpoint={endpoint} keys={["bookings"]} filters={({ setPage }) => <FilterPanel><Field as="select" label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, ...groomingStatuses.map((v) => ({ value: v, label: v }))]} /></FilterPanel>} columns={({ refresh }) => [{ header: "Service", render: (b) => b.serviceId?.serviceName }, { header: "Pet", render: (b) => b.petId?.petName }, { header: "Owner", render: (b) => userName(b.ownerId) }, { header: "Date", render: (b) => `${formatDate(b.bookingDate)} ${b.bookingTime || ""}` }, { header: "Status", render: (b) => <StatusBadge status={b.status} /> }, { header: "Actions", render: (b) => <div className="flex gap-2"><Button as={Link} to={`/admin/grooming-bookings/${getId(b)}`} variant="ghost">View</Button><Button onClick={() => updateStatus(b, refresh)}>Status</Button></div> }]} emptyTitle="No grooming bookings" />;
};

export const GroomingBookingDetails = () => {
  const { id } = useParams();
  const { data, loading, error, setData } = useSingle(`/grooming-bookings/${id}`, "booking");
  const [groomers, setGroomers] = useState([]);
  useEffect(() => { api.get("/admin/groomers?status=active&limit=100").then((res) => setGroomers(toArray(res.data, ["groomers"]))).catch(() => {}); }, []);
  if (loading) return <AdminLoader text="Loading booking..." />;
  const b = data;
  if (!b) return <EmptyState title="Booking not found" description={error} />;
  const assign = async (groomerId) => { const res = await api.patch(`/grooming-bookings/${id}/assign`, { groomerId }); setData({ ...b, groomerId: res.data.booking.groomerId || groomerId }); toast.success("Groomer assigned"); };
  const updateStatus = async () => {
    const status = window.prompt("Status: pending, accepted, rejected, cancelled, completed", b.status);
    if (!status) return;
    const res = await api.patch(`/admin/grooming-bookings/${id}`, { status });
    setData(res.data.booking);
    toast.success("Booking updated");
  };
  return <main><AdminPageHeader title="Grooming Booking" description="Booking detail and groomer assignment." action={<Button onClick={updateStatus}>Update Status</Button>} /><Panel className="mb-5"><Field as="select" label="Assign groomer" value={getId(b.groomerId) || ""} onChange={assign} options={[{ value: "", label: "Select groomer" }, ...groomers.map((g) => ({ value: getId(g), label: userName(g) }))]} /></Panel><DetailGrid title="Booking Details" description="" values={{ Service: b.serviceId?.serviceName, Pet: b.petId?.petName, Owner: userName(b.ownerId), Groomer: userName(b.groomerId), Date: formatDate(b.bookingDate), Time: b.bookingTime, Price: money(b.price), Status: b.status, Payment: b.paymentStatus }} /></main>;
};

export const Orders = () => {
  const [status, setStatus] = useState("");
  const endpoint = status ? `/orders/admin/all?orderStatus=${encodeURIComponent(status)}` : "/orders/admin/all?";
  const nextStatus = async (order, refresh) => {
    const index = orderStatuses.indexOf(order.orderStatus);
    const next = orderStatuses[index + 1];
    if (!next) return toast.error("No next status available");
    await api.patch(`/orders/admin/${getId(order)}/status`, { orderStatus: next });
    toast.success(`Order moved to ${next}`);
    refresh();
  };
  return <ResourceShell title="Orders" description="Manage shop orders and delivery statuses." endpoint={endpoint} keys={["orders"]} filters={({ setPage }) => <FilterPanel><Field as="select" label="Order status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, ...orderStatuses.map((v) => ({ value: v, label: v }))]} /></FilterPanel>} columns={({ refresh }) => [{ header: "Order", render: (o) => <><p className="font-semibold text-white">#{String(getId(o)).slice(-6)}</p><p className="text-xs text-slate-500">{userName(o.userId)}</p></> }, { header: "Items", render: (o) => o.totalItems }, { header: "Amount", render: (o) => money(o.totalAmount) }, { header: "Status", render: (o) => <StatusBadge status={o.orderStatus} /> }, { header: "Payment", render: (o) => <StatusBadge status={o.paymentStatus} /> }, { header: "Actions", render: (o) => <div className="flex gap-2"><Button as={Link} to={`/admin/orders/${getId(o)}`} variant="ghost">View</Button><Button onClick={() => nextStatus(o, refresh)}>Next</Button></div> }]} emptyTitle="No orders found" />;
};

export const Vaccinations = () => {
  const [status, setStatus] = useState("");
  const endpoint = status ? `/admin/vaccinations?status=${status}` : "/admin/vaccinations?";
  return (
    <ResourceShell
      title="Vaccinations"
      description="View upcoming, completed and overdue pet vaccinations."
      endpoint={endpoint}
      keys={["vaccinations"]}
      filters={({ setPage }) => (
        <FilterPanel>
          <Field as="select" label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "All statuses" }, "upcoming", "completed", "overdue"].map((value) => typeof value === "string" ? { value, label: value || "All statuses" } : value)} />
        </FilterPanel>
      )}
      columns={() => [
        { header: "Vaccine", render: (v) => <><p className="font-semibold text-white">{v.vaccineName}</p><p className="mt-1 text-xs text-slate-500">Dose {v.doseNumber || 1}</p></> },
        { header: "Pet", render: (v) => v.petId?.petName || "Pet" },
        { header: "Owner", render: (v) => userName(v.ownerId) },
        { header: "Due", render: (v) => v.overdueDays !== undefined ? `Overdue by ${v.overdueDays} days` : v.daysRemaining !== undefined ? `Due in ${v.daysRemaining} days` : formatDate(v.nextDueDate) },
        { header: "Status", render: (v) => <StatusBadge status={v.calculatedStatus || v.status} /> },
        { header: "Reminder", render: () => <Button variant="ghost" disabled>Send Later</Button> },
      ]}
      emptyTitle="No vaccinations found"
    />
  );
};

export const Reviews = () => {
  const [search, setSearch] = useState("");
  const endpoint = search ? `/reviews/admin/all?search=${encodeURIComponent(search)}` : "/reviews/admin/all?";
  const remove = async (review, refresh) => {
    if (!window.confirm("Delete this review?")) return;
    await api.delete(`/reviews/admin/${getId(review)}`);
    toast.success("Review deleted");
    refresh();
  };
  return (
    <ResourceShell
      title="Reviews"
      description="View and remove inappropriate product reviews."
      endpoint={endpoint}
      keys={["reviews"]}
      filters={({ setPage }) => (
        <FilterPanel>
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search reviews" />
        </FilterPanel>
      )}
      columns={({ refresh }) => [
        { header: "Product", render: (r) => r.productId?.productName || "Product" },
        { header: "User", render: (r) => userName(r.userId) },
        { header: "Rating", render: (r) => `${r.rating || 0}/5` },
        { header: "Comment", render: (r) => <p className="max-w-md text-slate-400">{r.comment}</p> },
        { header: "Status", render: (r) => <StatusBadge status={r.isActive ? "active" : "deleted"} /> },
        { header: "Actions", render: (r) => <Button variant="danger" onClick={() => remove(r, refresh)}>Delete</Button> },
      ]}
      emptyTitle="No reviews found"
    />
  );
};

export const OrderDetails = () => {
  const { id } = useParams();
  const { data, loading, error } = useSingle(`/orders/${id}`, "order");
  if (loading) return <AdminLoader text="Loading order..." />;
  const o = data;
  if (!o) return <EmptyState title="Order not found" description={error} />;
  return <main><AdminPageHeader title={`Order #${String(getId(o)).slice(-6)}`} description="Products, customer, address, total and status." action={<Button onClick={() => window.print()}>Print Invoice</Button>} /><Panel className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><InfoBlock label="Customer" value={userName(o.userId)} /><InfoBlock label="Total" value={money(o.totalAmount)} /><InfoBlock label="Status" value={<StatusBadge status={o.orderStatus} />} /><InfoBlock label="Payment" value={<StatusBadge status={o.paymentStatus} />} /><InfoBlock label="Shipping" value={[o.shippingAddress?.fullName, o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.state, o.shippingAddress?.postalCode].filter(Boolean).join(", ")} /></Panel><Panel><h2 className="text-lg font-bold text-white">Invoice Items</h2><div className="mt-4 space-y-3">{(o.items || []).map((item) => <div key={getId(item.productId) || item.productName} className="flex justify-between rounded-xl border border-white/10 bg-slate-950 p-4"><span>{item.productName}</span><span>{item.quantity} x {money(item.price)}</span></div>)}</div></Panel></main>;
};

export const Reports = () => {
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async (selectedRange = range) => { setLoading(true); const p = new URLSearchParams(); if (selectedRange.startDate) p.set("startDate", selectedRange.startDate); if (selectedRange.endDate) p.set("endDate", selectedRange.endDate); const res = await api.get(`/admin/reports?${p}`); setReport(res.data); setLoading(false); };
  useEffect(() => { load({ startDate: "", endDate: "" }); }, []);
  return <main><AdminPageHeader title="Reports" description="Platform totals, sales summaries and appointment analytics." action={<Button onClick={load}><RefreshCw size={16} /> Generate</Button>} /><FilterPanel><Field label="Start date" type="date" value={range.startDate} onChange={(v) => setRange({ ...range, startDate: v })} /><Field label="End date" type="date" value={range.endDate} onChange={(v) => setRange({ ...range, endDate: v })} /></FilterPanel>{loading ? <AdminLoader text="Generating reports..." /> : <div className="grid gap-5 lg:grid-cols-2"><ReportPanel title="Order Statuses" rows={report?.sales?.orderStatuses} amountKey="amount" /><ReportPanel title="Appointment Statuses" rows={report?.appointments} amountKey="fees" /><ReportPanel title="Popular Products" rows={report?.sales?.popularProducts} amountKey="sales" labelKey="name" /><ReportPanel title="User Growth" rows={report?.userGrowth} labelKey="_id" /></div>}</main>;
};

export const AdminProfile = () => {
  const { data, loading, error } = useSingle("/auth/profile", "user");
  if (loading) return <AdminLoader text="Loading profile..." />;
  if (!data) return <EmptyState title="Profile not found" description={error} />;
  return <DetailGrid title="Admin Profile" description="Your admin account information." values={{ Name: data.name, Email: data.email, Phone: data.phone, Role: data.role, Status: data.status }} />;
};

export const EditAdminProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  useEffect(() => { api.get("/auth/profile").then((res) => { const u = res.data.user || res.data; setForm({ name: u.name || "", email: u.email || "", phone: u.phone || "" }); }); }, []);
  const save = async (event) => { event.preventDefault(); await api.put("/auth/profile", form); toast.success("Profile updated"); navigate("/admin/profile"); };
  return <FormPage title="Edit Admin Profile" description="Update personal information." form={form} setForm={setForm} onSubmit={save} fields={["name", "email", "phone"]} />;
};

export const ChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const save = async (event) => { event.preventDefault(); await api.put("/auth/change-password", form); toast.success("Password updated"); setForm({ currentPassword: "", newPassword: "" }); };
  return <FormPage title="Change Password" description="Update your admin password." form={form} setForm={setForm} onSubmit={save} fields={[{ name: "currentPassword", type: "password", required: true }, { name: "newPassword", type: "password", required: true }]} submitText="Update Password" />;
};

export const Payments = () => <FutureModule icon={Lock} title="Payments" description="Payment management UI is ready for gateway integration later." bullets={["Payment list and filters", "Transaction details", "Refund action", "Export payments"]} />;
export const Notifications = () => <FutureModule icon={Bell} title="Notifications" description="Notification management UI is ready for backend enablement later." bullets={["System notification inbox", "Bulk send form", "Role targeting", "Delivery and read status"]} />;
export const SendNotification = () => <FutureModule icon={Bell} title="Send Notification" description="Bulk notification form reserved for backend enablement later." bullets={["Owners, vets, groomers or all users", "Announcement title and message", "Priority and schedule", "Delivery tracking"]} />;
export const Complaints = () => <FutureModule icon={Lock} title="Complaints" description="Complaint management needs complaint models and admin APIs." bullets={["Complaint list", "Admin response", "Resolution status", "Escalation history"]} />;
export const AuditLogs = () => <FutureModule icon={Lock} title="Audit Logs" description="Audit tracking needs a backend audit log model and write hooks." bullets={["Approvals", "Blocks", "Deletes", "Settings changes"]} />;
export const AdminSettings = () => <FutureModule icon={Lock} title="Platform Settings" description="Admin settings UI placeholder for platform configuration." bullets={["Platform contact settings", "Booking rules", "Security preferences", "Session policy"]} />;
