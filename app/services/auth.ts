import { aidenFetch as fetch, FetchBody } from "@/app/utils/fetch";
import { useSettingStore } from "@/app/store/setting";
import { GoogleLoginResponse, GoogleStatusResponse } from "../typing";

export async function apiGetSignUpCode(payload: { email: string }) {
  const params = {
    email: payload.email,
  };

  const result = await fetch("/auth/request_signup_code", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });

  return result.data;
}

export async function apiCompleteSignUp(payload: {
  email: string;
  password: string;
  code: string;
  profile_image_url: string;
}) {
  const params = {
    email: payload.email,
    password: payload.password,
    code: payload.code,
    profile_image_url: payload.profile_image_url,
  };
  const result = await fetch("/auth/complete_signup", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiLogin(payload: {
  email: string;
  password: string;
  captchaId: string;
  captchaAnswer: string;
}) {
  const params = {
    email: payload.email,
    password: payload.password,
    captcha_id: payload.captchaId,
    captcha_answer: payload.captchaAnswer,
  };
  const response = await fetch("/auth/login", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return response.data;
}

export async function apiLogout(refreshToken: string) {
  const params = {
    refresh_token: refreshToken,
  };
  const result = await fetch("/auth/logout", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function googleLogin(): Promise<GoogleLoginResponse> {
  const result = await fetch("/auth/google/login ", {
    method: "GET",
  });
  return result.data as GoogleLoginResponse;
}

export async function googleLoginStatus({
  session_id,
}: {
  session_id: string;
}): Promise<GoogleStatusResponse> {
  const device_id = useSettingStore.getState().getDeviceId();

  const result = await fetch(
    `/auth/google/status?session_id=${session_id}&device_id=${device_id}`,
    {
      method: "GET",
    },
  );
  return result.data as GoogleStatusResponse;
}

export async function apiRefreshToken(refreshToken: string) {
  const params = {
    refresh_token: refreshToken,
  };
  const result = await fetch("/auth/refresh_token", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
    _isRefreshToken: true,
  });
  return result.data;
}

export function isRefreshRequest(
  config: FetchBody & { _isRefreshToken?: boolean },
) {
  return !!config._isRefreshToken;
}

export async function apiResetPasswordCode(email: string) {
  const params = {
    email,
  };
  const result = await fetch("/auth/request_reset_password_code", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
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
  const result = await fetch("/auth/complete_reset_password", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiChangePassword(payload: {
  oldVal: string;
  newVal: string;
  confirmVal: string;
}) {
  const params = {
    old_password: payload.oldVal,
    new_password: payload.newVal,
    new_password_confirm: payload.confirmVal,
  };
  const result = await fetch("/auth/change_password", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiGetRegion() {
  const params = {};
  const result = await fetch("/api/country/info", {
    method: "GET",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiGetUserPlan() {
  const params = {};
  const result = await fetch("/api/user/info", {
    method: "GET",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiGetInviteCode() {
  const params = {};
  const result = await fetch("/api/invitation_codes", {
    method: "GET",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiCheckInviteCode(code: string) {
  const params = {};
  const result = await fetch(`/api/check/invite_code?code=${code}`, {
    method: "GET",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiSetInviteCode(code: string) {
  const params = {
    invitation_code: code,
  };
  const result = await fetch("/api/user/invitation_code", {
    method: "GET",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}

export async function apiGetCaptcha() {
  const params = {};
  const result = await fetch("/auth/captcha", {
    method: "GET",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result.data;
}
