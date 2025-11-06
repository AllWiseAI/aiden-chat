import { aidenFetch as fetch } from "@/app/utils/fetch";

export async function apiGetLLMProcess(payload: {
  template: string;
  args: string;
}) {
  const params = {
    template: payload.template,
    args: {
      content: payload.args,
    },
  };
  const result = await fetch("/api/llm_process", {
    method: "POST",
    body: {
      type: "Json",
      payload: params,
    },
  });
  return result;
}
