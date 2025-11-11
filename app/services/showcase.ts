import { aidenFetch as fetch } from "@/app/utils/fetch";
import { ShowcaseListOption } from "../typing";

export const getShowcaseList = async (): Promise<ShowcaseListOption[]> => {
  const { data } = await fetch("/api/showcase/", {
    method: "GET",
    body: {
      type: "Json",
      payload: {},
    },
  });
  return (data as ShowcaseListOption[]) ?? [];
};
