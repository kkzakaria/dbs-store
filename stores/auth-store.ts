import { create } from "zustand"

type AuthView = "login" | "register" | "verify-otp"

interface AuthStore {
  isOpen: boolean
  view: AuthView
  phone: string | null

  // Actions
  openLogin: () => void
  openRegister: () => void
  openVerifyOTP: (phone: string) => void
  close: () => void
  setView: (view: AuthView) => void
  setPhone: (phone: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  isOpen: false,
  view: "login",
  phone: null,

  openLogin: () => set({ isOpen: true, view: "login" }),
  openRegister: () => set({ isOpen: true, view: "register" }),
  openVerifyOTP: (phone: string) => set({ isOpen: true, view: "verify-otp", phone }),
  close: () => set({ isOpen: false }),
  setView: (view: AuthView) => set({ view }),
  setPhone: (phone: string | null) => set({ phone }),
  reset: () => set({ isOpen: false, view: "login", phone: null }),
}))
