"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, UserRole } from "@/types/database";
import { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  role: "viewer",
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchUserProfile(currentUser: User | null) {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.warn("Profil belum ditemukan, fallback ke metadata:", error);
        // Fallback default jika row profile belum sempat ter-trigger
        setProfile({
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Pengguna",
          role: "admin", // fallback aman
          created_at: new Date().toISOString(),
        });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const initialUser = session?.user || null;
      setUser(initialUser);
      await fetchUserProfile(initialUser);

      // Listen perubahan auth state (login/logout)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        const u = newSession?.user || null;
        setUser(u);
        await fetchUserProfile(u);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initUser();
  }, []);

  const role: UserRole = profile?.role || "viewer";
  const isAdmin = role === "admin";

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        refreshProfile: () => fetchUserProfile(user),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser harus digunakan di dalam UserProvider");
  }
  return context;
}
