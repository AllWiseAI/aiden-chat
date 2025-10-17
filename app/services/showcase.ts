import { aidenFetch as fetch } from "@/app/utils/fetch";
import { ShowcaseListOption } from "../typing";

export const getShowcaseList = async (): Promise<ShowcaseListOption[]> => {
  const { data, status } = await fetch("/api/showcase/", {
    method: "GET",
    body: {
      type: "Json",
      payload: {},
    },
  });
  if (status === 200) {
    return (data as ShowcaseListOption[]) ?? [];
  }
  return [];
};
