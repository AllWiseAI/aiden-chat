import { aidenFetch as fetch } from "@/app/utils/fetch";
import { ModelOption } from "../typing";
const baseURL =
  process.env.NODE_ENV === "development"
    ? "https://dev.aidenai.io"
    : "https://prod.aidenai.io";

export const getModelList = async (): Promise<ModelOption[]> => {
  const { data, status } = await fetch(`${baseURL}/api/v1/models`, {
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
