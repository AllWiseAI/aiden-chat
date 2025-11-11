import { aidenFetch as fetch } from "@/app/utils/fetch";
import { ModelOption, ProviderOption } from "../typing";

export const getModelList = async (): Promise<ModelOption[]> => {
  const { data } = await fetch("/api/v1/models", {
    method: "GET",
    body: {
      type: "Json",
      payload: {},
    },
  });
  return (data as ModelOption[]) ?? [];
};

export const getProviderList = async (): Promise<ProviderOption[]> => {
  const { data } = await fetch("/api/v1/providers", {
    method: "GET",
    body: {
      type: "Json",
      payload: {},
    },
  });
  return (data as ProviderOption[]) ?? [];
};
