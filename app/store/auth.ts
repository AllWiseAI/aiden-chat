import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  apiCompleteSignUp,
  apiLogin,
  apiLogout,
  apiRefreshToken,
} from "@/app/services";
import { TokenType, User, LoginResponse, RefreshResponse } from "../typing";

const DEFAULT_AUTH_STATE = {
  isLogin: false,
  user: {} as User,
  userToken: {} as TokenType,
};

export const useAuthStore = createPersistStore(
  {
    _hasHydrated: false,
    ...DEFAULT_AUTH_STATE,
  },
  (set, get) => {
    function _get() {
      return {
        ...get(),
        ...methods,
      };
    }

    const methods = {
      setHydrated: () => {
        set({ _hasHydrated: true });
      },
      signup: async (
        code: string,
        email: string,
        password: string,
        profile: string,
      ) => {
        try {
          const res = (await apiCompleteSignUp({
            code,
            email,
            password,
            profile_image_url: profile,
          }).catch((err) => {
            throw new Error(err);
          })) as {
            id: number;
            email: string;
            profile_image_url: string;
            access_token: string;
            refresh_token: string;
            expires_at: number;
          };
          if ("error" in res) {
            throw new Error(res.error as string);
          } else {
            const {
              id,
              email: _email,
              profile_image_url,
              access_token,
              refresh_token,
              expires_at: expires,
            } = res;
            set({
              isLogin: true,
              user: {
                id,
                email: _email,
                profile: profile_image_url,
              },
              userToken: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expires,
              },
            });
            return true;
          }
        } catch (e: any) {
          set({ _hasHydrated: get()._hasHydrated, ...DEFAULT_AUTH_STATE });
          throw new Error(`Signup Failed: ${e.message}`);
        }
      },

      initialize: async () => {
        if (!get()._hasHydrated) return false;
        const { userToken, refreshToken } = _get();
        if (userToken.accessToken && userToken.expires * 1000 > Date.now()) {
          // setAuth
          return true;
        }
        if (userToken.refreshToken) {
          try {
            await refreshToken();
            // setAuth
            return true;
          } catch (e: any) {
            console.error("refresh token err:", JSON.stringify(e));
          }
        }
        set({ _hasHydrated: get()._hasHydrated, ...DEFAULT_AUTH_STATE });
        return false;
      },

      login: async (email: string, password: string) => {
        try {
          const response = (await apiLogin({
            email,
            password,
          }).catch((err) => {
            throw new Error(err);
          })) as LoginResponse;

          if ("access_token" in response) {
            const {
              access_token,
              refresh_token,
              expires_at: expires,
              profile_image_url,
              id,
            } = response;
            set({
              isLogin: true,
              user: {
                id,
                email,
                profile: profile_image_url,
              },
              userToken: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expires,
              },
            });
            return true;
          } else if ("error" in response) {
            throw new Error(response.error);
          } else {
            throw new Error("Token not found in response");
          }
        } catch (e: any) {
          set({ _hasHydrated: get()._hasHydrated, ...DEFAULT_AUTH_STATE });
          if (e.message === "Invalid Credentials") throw new Error("密码错误");
          else throw new Error(`Login Failed: ${e.message}`);
        }
      },

      logout: async () => {
        try {
          const { userToken } = get();
          const { status } = (await apiLogout(
            userToken.refreshToken ?? "",
          )) as {
            status: boolean;
          };
          if (status) return true;
          else throw new Error(`Logout status err`);
        } catch (e: any) {
          throw new Error(`Logout Failed: ${e.message}`);
        } finally {
          set({ _hasHydrated: get()._hasHydrated, ...DEFAULT_AUTH_STATE });
        }
      },

      refreshToken: async () => {
        try {
          const { userToken } = get();
          const response = (await apiRefreshToken(
            userToken.refreshToken,
          )) as RefreshResponse;
          if ("access_token" in response) {
            const { access_token, refresh_token, expires_at } = response;
            set({
              isLogin: true,
              user: get().user,
              userToken: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expires: expires_at,
              },
            });
          } else if ("error" in response) {
            throw new Error(response.error);
          } else {
            throw new Error("Token not found in response");
          }
        } catch (e: any) {
          throw new Error(`Refresh Token Failed: ${e.message}`);
        }
      },
    };
    return methods;
  },
  {
    name: StoreKey.Auth,
    version: 2,
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) {
          console.log("an error happened during hydration", error);
        } else {
          state?.setHydrated();
        }
      };
    },
  },
);
