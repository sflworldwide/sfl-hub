import React, { createContext, useContext, useState } from 'react';

const UserListContext = createContext();

export const UserListProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    userType: "",
    email: "",
    createdOn: "",
    accountNumber: "",
    managedBy: "",
    status: "",
  });

  const [searchFilters, setSearchFilters] = useState({
    name: "",
    userName: "",
    userType: "",
    email: "",
    createdOn: "",
    accountNumber: "",
    managedBy: "",
    status: "",
  });

  const resetFormData = () => {
    setFormData({
      name: "",
      userName: "",
      userType: "",
      email: "",
      createdOn: "",
      accountNumber: "",
      managedBy: "",
      status: "",
    });
    setSearchFilters({
      name: "",
      userName: "",
      userType: "",
      email: "",
      createdOn: "",
      accountNumber: "",
      managedBy: "",
      status: "",
    });
  };

  return (
    <UserListContext.Provider value={{
      formData,
      setFormData,
      searchFilters,
      setSearchFilters,
      resetFormData
    }}>
      {children}
    </UserListContext.Provider>
  );
};

export const useUserListContext = () => { 
    return useContext(UserListContext) 
};