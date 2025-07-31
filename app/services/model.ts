import { aidenFetch as fetch } from "@/app/utils/fetch";
import { ModelOption, ProviderOption } from "../typing";

export const getModelList = async (): Promise<ModelOption[]> => {
  const { data, status } = await fetch("/api/v1/models", {
    method: "GET",
    body: {
      type: "Json",
      payload: {},
    },
  });
  if (status === 200) {
    return (data as ModelOption[]) ?? [];
  }
  return [];
};

export const getProviderList = async (): Promise<ProviderOption[]> => {
  const { data, status } = await fetch("/api/v1/providers", {
    method: "GET",
    body: {
      type: "Json",
      payload: {},
    },
  });
  if (status === 200) {
    return (data as ProviderOption[]) ?? [];
  }
  return [];
};
