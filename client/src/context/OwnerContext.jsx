import { useCallback, useMemo, useState } from "react";

import api from "../services/api";
import OwnerContext from "./OwnerContextValue";

const toArray = (payload, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload)) return payload;
  return [];
};

export const OwnerProvider = ({ children }) => {
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);

  const refreshOwnerData = useCallback(async () => {
    const [petsRes, appointmentsRes, vaccinationsRes] = await Promise.all([
      api.get("/pets"),
      api.get("/appointments"),
      api.get("/vaccinations"),
    ]);

    setPets(toArray(petsRes.data, ["pets"]));
    setAppointments(toArray(appointmentsRes.data, ["appointments"]));
    setVaccinations(toArray(vaccinationsRes.data, ["vaccinations"]));
  }, []);

  const value = useMemo(
    () => ({
      pets,
      appointments,
      vaccinations,
      setPets,
      setAppointments,
      setVaccinations,
      refreshOwnerData,
    }),
    [pets, appointments, vaccinations, refreshOwnerData]
  );

  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
};
