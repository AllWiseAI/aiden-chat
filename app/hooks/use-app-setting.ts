import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";

export default function useAppSetting() {
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = listen("open-setting", () => {
      navigate(Path.Settings);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [navigate]);
}
