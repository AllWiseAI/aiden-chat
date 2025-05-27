import axios from "axios";

export const AUTHORIZATION_PREFIX = "Bearer";
export const setAuthorization = (authorization: string) => {
  axios.defaults.headers.common.Authorization = authorization
    ? `${AUTHORIZATION_PREFIX} ${authorization}`
    : "";
};
