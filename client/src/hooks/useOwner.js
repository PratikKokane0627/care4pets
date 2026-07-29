import { useContext } from "react";

import OwnerContext from "../context/OwnerContextValue";

const useOwner = () => {
  const context = useContext(OwnerContext);

  if (!context) {
    throw new Error("useOwner must be used inside OwnerProvider");
  }

  return context;
};

export default useOwner;
