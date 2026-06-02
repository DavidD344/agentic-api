import { create } from 'zustand';

export enum AuthOptionsView {
  LOGIN = "LOGIN",
  SIGNUP = "SIGNUP",
  SIGNUP_OPTION = "SIGNUP_OPTION",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  FORGOT_PASSWORD_CODE = "FORGOT_PASSWORD_CODE",

  RECOVER_PASSWORD = "RECOVER_PASSWORD",
}
interface AuthOptionsStore {
  authOptionsView: AuthOptionsView;
  setAuthOptionsView: (view: AuthOptionsView) => void;
}

export const useAuthOptionsView = create<AuthOptionsStore>((set) => ({
  authOptionsView: AuthOptionsView.LOGIN, // Estado inicial
  setAuthOptionsView: (view) => set({ authOptionsView: view }),
}));