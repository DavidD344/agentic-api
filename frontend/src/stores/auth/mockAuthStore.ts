import { create } from "zustand";

interface MockAuthState {
  login: boolean;
  setLogin: (value: boolean) => void;
}

const useMockAuthStore = create<MockAuthState>((set) => ({
  login: false,
  setLogin: (value) => set({ login: value }),
}));

export default useMockAuthStore;