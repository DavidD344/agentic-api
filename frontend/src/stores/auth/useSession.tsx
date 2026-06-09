"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { mainApi } from "../../api-queries/mainApi";
import { postSession } from "@/api-queries/requests/auth/postSession";
import { SessionParams } from "@/api-queries/modules/auth/params/SessionParams";
// import { postSession } from "../../api-queries/requests/auth/postSession";

interface State {
  userId?: string;
  userData?:
    | {
        name: string;
        role: string;
        email?: string;
      }
    | undefined;
  token?: string;
  refreshToken?: string;
  loading: boolean;
  isRefreshingToken: boolean;
  signIn: (params: SessionParams) => Promise<void | AxiosError>;
  signOut: () => void;
  tokenInvalidation: () => void;
  tokenAxiosUpdate: () => void;
  refreshTokenUpdate: () => Promise<void>;
  getUserRole: () => string;
  checkTokenIsValid: () => boolean;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useSession = create<State>()(
  persist(
    (set, get) => ({
      userId: undefined,
      userData: undefined,
      token: undefined,
      loading: false,
      isRefreshingToken: false,
      tokenAxiosUpdate: () => {
        const { token } = get();
        if (token) {
          mainApi.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
      },

      signIn: async ({ email, password }: SessionParams) => {
        try {
          set({ loading: true });
          const sessionData = await postSession({ email, password }); // request
          // const sessionData = {id_token:'',role:'',id:'',email:'',name:''}
          mainApi.defaults.headers.common.Authorization = `Bearer ${sessionData.token}`;
          console.log(sessionData)
          set({
            loading: false,
            userId: `${sessionData.id}`,
            refreshToken: sessionData.token,
            token: sessionData.token,
            userData: {
              role: sessionData.role,
              name: sessionData.name,
              email: sessionData.email,
            },
          });
        } catch (err) {
          set({ loading: false });
          throw new AxiosError();
        }
      },
      signOut: () => {
        mainApi.defaults.headers.common.Authorization = "";
        set({
          userId: undefined,
          userData: undefined,
          refreshToken: undefined,
          token: undefined,
        });
      },
      tokenInvalidation: () => {
        const { refreshToken, userId, userData } = get();
        set({
          userId,
          userData,
          refreshToken,
          token: "invalidado",
        });
        useSession.getState().tokenAxiosUpdate();
      },
      refreshTokenUpdate: async () => {
        const { isRefreshingToken } = get();

        if (isRefreshingToken) return;

        try {
          mainApi.defaults.headers.common.Authorization = "";
          set({
            isRefreshingToken: false,
            userId: undefined,
            userData: undefined,
            refreshToken: undefined,
            token: undefined,
          });
          return;
          /*
          set({ isRefreshingToken: true });
          if (refreshToken) {
            const refreshTokenData = await postRefreshToken({ refreshToken });
            mainApi.defaults.headers.common.Authorization = `Bearer ${refreshTokenData.token}`;
            set({
              userId,
              userData,
              refreshToken: refreshTokenData.refreshToken,
              token: refreshTokenData.token,
              isRefreshingToken: false,
            });
            window.location.reload();
          } else {
            mainApi.defaults.headers.common.Authorization = "";
            set({
              isRefreshingToken: false,
              userId: undefined,
              userData: undefined,
              refreshToken: undefined,
              token: undefined,
            });
          }
          */
        } catch (err: any) {
          if (err instanceof AxiosError) {
            set({
              isRefreshingToken: false,
              userId: undefined,
              userData: undefined,
              refreshToken: undefined,
              token: undefined,
            });
          }
        }
      },
      checkTokenIsValid: () => {
        const { token } = get();

        try {
          if (token) {
            const decodedToken = jwtDecode<any>(token);
            if (decodedToken.exp * 1000 < Date.now()) return false;
            return true;
          }
        } catch (error) {
          return false;
        }
        return false;
      },
      getUserRole: () => {
        const { token } = get();

        try {
          if (token) {
            const decodedToken = jwtDecode<any>(token);
            return decodedToken.role;
          }
        } catch (error) {
          return "";
        }
      },
    }),
    {
      partialize: (state: State) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        userId: state.userId,
        userData: state.userData,
      }),
      name: "session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
    }
  )
);
mainApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const resp = error.response;
    const data = resp?.data as any;

    if (data?.error === "Invalid token") {
      await useSession.getState().signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/";
        window.location.reload();
      }
      return Promise.reject(error);
    }
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 500)
    ) {
      const isValid = useSession.getState().checkTokenIsValid();
      if (!isValid) {
        await useSession.getState().signOut();
        if (typeof window !== "undefined") {
          window.location.href = "/";
          window.location.reload();
        }
      } else {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
useSession.getState().tokenAxiosUpdate();
