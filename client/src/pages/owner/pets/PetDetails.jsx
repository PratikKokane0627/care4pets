import { useState } from "react";
import { useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import {
  ErrorState,
  InfoBlock,
  Panel,
  formatDate,
  itemImage,
  petName,
} from "../ownerShared";

const PetDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState([]);

  const { loading, error } = useFetch(async () => {
    const [petRes, historyRes] = await Promise.allSettled([
      api.get(`/pets/${id}`),
      api.get(`/pets/${id}/medical-history`),
    ]);
    if (petRes.status === "fulfilled") {
      setPet(petRes.value.data.pet || petRes.value.data);
    }
    if (historyRes.status === "fulfilled") {
      setHistory(historyRes.value.data.history || historyRes.value.data.records || []);
    }
  }, id);

  if (loading) return <Loader label="Loading pet details" />;

  return (
    <main>
      <PageHeader title={petName(pet)} description="Pet profile details and medical history." />
      <ErrorState message={error} />
      {!pet ? (
        <EmptyState title="Pet not found" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <Panel>
            <img
              src={itemImage(pet) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80"}
              alt={petName(pet)}
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <div className="mt-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{petName(pet)}</h2>
              <StatusBadge status={pet.vaccinationStatus} />
            </div>
          </Panel>

          <Panel>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoBlock label="Species" value={pet.species} />
              <InfoBlock label="Breed" value={pet.breed} />
              <InfoBlock label="Age" value={`${pet.age || 0} years`} />
              <InfoBlock label="Gender" value={pet.gender} />
              <InfoBlock label="Weight" value={`${pet.weight || 0} kg`} />
              <InfoBlock label="Birth Date" value={formatDate(pet.dateOfBirth)} />
            </div>

            <h3 className="mt-7 text-lg font-bold text-white">Medical History</h3>
            {history.length ? (
              <div className="mt-4 space-y-3">
                {history.map((item) => (
                  <div key={item._id || item.id} className="rounded-xl border border-white/10 bg-slate-950 p-4">
                    <p className="font-semibold text-white">{item.diagnosis || item.reason || "Health record"}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.prescription || item.notes || "No notes added"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">{pet.medicalHistory || "No medical history added yet."}</p>
            )}
          </Panel>
        </div>
      )}
    </main>
  );
};

export default PetDetails;

