import { fetch } from "@tauri-apps/api/http";
import { useSettingStore } from "../store/setting";

const baseURL =
  process.env.NODE_ENV === "development"
    ? "https://dev.aidenai.io/app"
    : "https://prod.aidenai.io";

const getCommonHeaders = () => {
  const device_id = useSettingStore.getState().getDeviceId();
  return {
    "Content-Type": "application/json",
    "X-Device-ID": device_id,
  };
};

export async function apiGetSignUpCode(payload: { email: string }) {
  const params = {
    email: payload.email,
  };

  const result = await fetch(`${baseURL}/auth/request_signup_code`, {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    headers: { ...getCommonHeaders() },
  });

  return result.data;
}

export async function apiCompleteSignUp(payload: {
  name: string;
  email: string;
  password: string;
  code: string;
  profile_image_url: string;
}) {
  const params = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    code: payload.code,
    profile_image_url: payload.profile_image_url,
  };
  const result = await fetch(`${baseURL}/auth/complete_signup`, {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    headers: { ...getCommonHeaders() },
  });
  return result.data;
}

export async function apiLogin(payload: { email: string; password: string }) {
  const params = {
    email: payload.email,
    password: payload.password,
  };
  const response = await fetch(`${baseURL}/auth/login`, {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    headers: { ...getCommonHeaders() },
  });
  return response.data;
}

export async function apiLogout(token: string) {
  const params = {};
  const result = await fetch(`${baseURL}/auth/logout`, {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    headers: { ...getCommonHeaders(), Authorization: `Bearer ${token}` },
  });
  return result.data;
}

export async function apiResetPasswordCode(email: string) {
  const params = {
    email,
  };
  const result = await fetch(`${baseURL}/auth/request_reset_password_code`, {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    headers: { ...getCommonHeaders() },
  });
  return result.data;
}

export async function apiCompleteResetPassword(payload: {
  email: string;
  password: string;
  code: string;
}) {
  const params = {
    email: payload.email,
    password: payload.password,
    code: payload.code,
  };
  const result = await fetch(`${baseURL}/auth/complete_reset_password`, {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    headers: { ...getCommonHeaders() },
  });
  return result.data;
}
