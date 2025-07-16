import { useEffect, useRef } from "react";
import { getLocalToken } from "../services";
import { useAppConfig } from "../store";

export function useGetToken() {
  const config = useAppConfig();
  const fetchedTokenRef = useRef(false);
  useEffect(() => {
    if (fetchedTokenRef.current) {
      return;
    }
    fetchedTokenRef.current = true;
    async function getToken() {
      try {
        const token = await getLocalToken();
        const { data } = token;
        config.setLocalToken(data);
      } catch (error) {
        console.error("getLocalToken error", JSON.stringify(error));
      }
    }
    getToken();
  }, []);
}
