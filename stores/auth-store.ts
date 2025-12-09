import { create } from "zustand"

type AuthView = "login" | "register" | "verify-email" | "forgot-password" | "reset-sent"

interface AuthStore {
  isOpen: boolean
  view: AuthView
  email: string | null

  // Actions
  openLogin: () => void
  openRegister: () => void
  openVerifyEmail: (email: string) => void
  openForgotPassword: () => void
  openResetSent: (email: string) => void
  close: () => void
  setView: (view: AuthView) => void
  setEmail: (email: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  isOpen: false,
  view: "login",
  email: null,

  openLogin: () => set({ isOpen: true, view: "login" }),
  openRegister: () => set({ isOpen: true, view: "register" }),
  openVerifyEmail: (email: string) => set({ isOpen: true, view: "verify-email", email }),
  openForgotPassword: () => set({ isOpen: true, view: "forgot-password" }),
  openResetSent: (email: string) => set({ isOpen: true, view: "reset-sent", email }),
  close: () => set({ isOpen: false }),
  setView: (view: AuthView) => set({ view }),
  setEmail: (email: string | null) => set({ email }),
  reset: () => set({ isOpen: false, view: "login", email: null }),
}))
