import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("syncspace_token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getClientToken();
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const data = await api.get("/api/auth/me");
          setUser(data.user);
        } catch {
          if (typeof window !== "undefined") {
            localStorage.removeItem("syncspace_token");
          }
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    const timer = setTimeout(loadUser, 0);
    return () => clearTimeout(timer);
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await api.post("/api/auth/login", { email, password });
    if (typeof window !== "undefined") {
      localStorage.setItem("syncspace_token", data.token);
    }
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.post("/api/auth/register", { name, email, password });
    if (typeof window !== "undefined") {
      localStorage.setItem("syncspace_token", data.token);
    }
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("syncspace_token");
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
