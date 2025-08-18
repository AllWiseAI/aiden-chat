import { aidenFetch as fetch, FetchBody } from "@/app/utils/fetch";

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
  inviteCode: string;
  profile_image_url: string;
}) {
  const params = {
    email: payload.email,
    password: payload.password,
    code: payload.code,
    invitation_code: payload.inviteCode,
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

export async function apiLogin(payload: { email: string; password: string }) {
  const params = {
    email: payload.email,
    password: payload.password,
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
