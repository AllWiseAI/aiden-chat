// components/ConfirmAPIProvider.tsx
import { useEffect } from "react";
import { useConfirm } from "./confirm-context";
import { setGlobalConfirm } from "./confirm";

export const ConfirmAPIProvider = () => {
  const confirm = useConfirm();

  useEffect(() => {
    setGlobalConfirm(confirm);
  }, [confirm]);

  return null;
};
