import { toast as sonnerToast } from "sonner";

const defaultOptions = {
  className: "w-auto max-w-max",
};

function success(message: string, options = {}) {
  return sonnerToast.success(message, {
    ...defaultOptions,
    ...options,
  });
}

function error(message: string, options = {}) {
  return sonnerToast.error(message, {
    ...defaultOptions,
    ...options,
  });
}

function info(message: string, options = {}) {
  return sonnerToast.info(message, {
    ...defaultOptions,
    ...options,
  });
}

function warning(message: string, options = {}) {
  return sonnerToast.warning(message, {
    ...defaultOptions,
    ...options,
  });
}

export const toast = {
  success,
  error,
  info,
  warning,
};
