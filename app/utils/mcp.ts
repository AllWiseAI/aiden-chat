import { searchMcpServerStatus } from "@/app/services";

import { McpAction } from "@/app/typing";

export const fetchMcpStatus = async (name: string): Promise<McpAction> => {
  try {
    const res = (await searchMcpServerStatus(name)) as any;
    if (!res || !res.data) {
      throw new Error("No data");
    }
    const { data } = res;
    if (data.status) return data.status;
    else throw new Error("No status");
  } catch (e) {
    return McpAction.Failed;
  }
};
