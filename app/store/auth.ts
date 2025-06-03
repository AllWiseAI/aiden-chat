import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import { apiCompleteSignUp, apiLogin, apiLogout } from "@/app/services";

interface TokenType {
  token: string;
  expires: number;
}

interface User {
  id: number;
  email: string;
  profile: string;
}

const DEFAULT_AUTH_STATE = {
  isLogin: false,
  user: {} as User,
  userToken: {} as TokenType,
};

type LoginSuccessResponse = {
  token: string;
  expires_at: number;
  profile_image_url: string;
  id: number;
};

type LoginErrorResponse = {
  error: string;
};
type LoginResponse = LoginSuccessResponse | LoginErrorResponse;
export const useAuthStore = createPersistStore(
  {
    _hasHydrated: false,
    ...DEFAULT_AUTH_STATE,
  },
  (set, get) => ({
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
          token: string;
          expires_at: number;
        };
        if ("error" in res) {
          throw new Error(res.error as string);
        } else {
          const {
            id,
            email: _email,
            profile_image_url,
            token,
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
              token,
              expires,
            },
          });
          return true;
        }
      } catch (e: any) {
        set({ _hasHydrated: get()._hasHydrated, ...DEFAULT_AUTH_STATE });
        if (e.message.includes("Network Error")) {
          throw new Error("Error: Connection Error");
        } else {
          throw new Error(`Signup Failed: ${e.message}`);
        }
      }
    },

    initialize: () => {
      if (!get()._hasHydrated) return false;
      const { userToken } = get();
      if (userToken.token && userToken.expires * 1000 > Date.now()) {
        return true;
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

        const {
          token,
          expires_at: expires,
          profile_image_url,
          id,
        } = response as {
          token: string;
          expires_at: number;
          profile_image_url: string;
          id: number;
        };
        if (token) {
          set({
            isLogin: true,
            user: {
              id,
              email,
              profile: profile_image_url,
            },
            userToken: {
              token,
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
        if (e.message.includes("Network Error")) {
          throw new Error("Error: Connection Error");
        } else if (e.message === "Invalid Credentials")
          throw new Error("密码错误");
        else throw new Error(`Login Failed: ${e.message}`);
      }
    },

    logout: async () => {
      try {
        const { userToken } = get();
        const { status } = (await apiLogout(userToken.token ?? "")) as {
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
  }),
  {
    name: StoreKey.Auth,
    version: 1,
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
