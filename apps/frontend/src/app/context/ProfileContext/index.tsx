"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usersApi, type UserProfile } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refresh: async () => {},
  setProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await usersApi.getMe();
      setProfile(user);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refresh();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [token, refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
