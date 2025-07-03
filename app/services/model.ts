import { aidenFetch as fetch } from "@/app/utils/fetch";
import { ModelOption } from "../typing";

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
