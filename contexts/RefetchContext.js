import React, { createContext, useContext, useState } from 'react';

const RefetchContext = createContext();

export const RefetchProvider = ({ children }) => {
  const [refetchCounter, setRefetchCounter] = useState(0);

  const triggerRefetch = () => {
    setRefetchCounter((prev) => prev + 1);
  };

  return (
    <RefetchContext.Provider value={{ refetchCounter, triggerRefetch }}>
      {children}
    </RefetchContext.Provider>
  );
};

// Custom hook to use the context
export const useRefetchContext = () => {
  return useContext(RefetchContext);
};
