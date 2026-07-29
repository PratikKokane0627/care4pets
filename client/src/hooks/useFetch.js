import { useEffect, useRef, useState } from "react";

const useFetch = (load, dependencyKey = "once") => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadRef = useRef(load);

  loadRef.current = load;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    loadRef
      .current()
      .catch((err) => {
        if (alive) {
          setError(err.response?.data?.message || "Could not load data");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [dependencyKey]);

  return { loading, error };
};

export default useFetch;
