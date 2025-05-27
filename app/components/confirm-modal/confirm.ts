// lib/confirm.ts
import { ConfirmOptions } from "./confirm-context";

let internalShowConfirm: ((opts: ConfirmOptions) => Promise<string>) | null =
  null;

export enum ConfirmType {
  Always = "always",
  Once = "once",
  Decline = "decline",
  Confirm = "confirm",
  Cancel = "cancel",
}

export const setGlobalConfirm = (
  fn: (opts: ConfirmOptions) => Promise<string>,
) => {
  internalShowConfirm = fn;
};

export const showConfirm = (opts: ConfirmOptions) => {
  if (!internalShowConfirm) {
    throw new Error("ConfirmProvider not mounted yet.");
  }
  return internalShowConfirm(opts);
};
