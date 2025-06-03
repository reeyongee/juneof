"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isSignedIn: boolean;
  userEmail: string | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuthState = localStorage.getItem("juneof_auth");
    if (savedAuthState) {
      const { isSignedIn: savedIsSignedIn, userEmail: savedUserEmail } =
        JSON.parse(savedAuthState);
      setIsSignedIn(savedIsSignedIn);
      setUserEmail(savedUserEmail);
    }
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "juneof_auth",
      JSON.stringify({ isSignedIn, userEmail })
    );
  }, [isSignedIn, userEmail]);

  const signIn = (email: string) => {
    setIsSignedIn(true);
    setUserEmail(email);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setUserEmail(null);
  };

  const value = {
    isSignedIn,
    userEmail,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
