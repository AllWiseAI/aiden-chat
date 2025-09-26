import { StoreKey } from "../constant";
import { useAppConfig } from "../store";
import { Agent } from "../typing";
import { createPersistStore } from "../utils/store";
import { nanoid } from "nanoid";

const DEFAULT_AGENT_STATE = {
  agents: [] as Agent[],
};

export function createAgent(): Agent {
  const { defaultModel } = useAppConfig.getState();

  return {
    id: nanoid(),
    name: "",
    avatar: "😃",
    source: "custom",
    description: "",
    prompt: "",
    type: undefined,
    model: defaultModel,
  };
}

export const useAgentStore = createPersistStore(
  DEFAULT_AGENT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }
    const methods = {
      init: () => {
        // 初始化默认agent
        // const defaultAgent = [
        //   {
        //     id: "1",
        //     name: "Multimodal Agent",
        //     avatar: "😝",
        //     source: "default",
        //     description:
        //       "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
        //     prompt: `You are a senior AI - Powered Product Operations expert with over 5 years of practical experience in tech products (SaaS, mobile, web, etc.). You deeply understand the operational logic of the entire product lifecycle. Your role is to translate product strategies into executable business results via data - driven approaches, cross - team collaboration, user insights, and process optimization, ultimately achieving the alignment of "maximizing product value" and "user/business goals".`,
        //     type: "Multimodal",
        //     model: "deepseek-chat",
        //   },
        // ];
      },
      addAgent: (agent: Agent) => {
        set({ agents: [...get().agents, agent] });
      },
      getAgentById: (id: string) => {
        return get().agents.find((agent) => agent.id === id);
      },
      updateAgent: (updatedAgent: Agent) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === updatedAgent.id ? updatedAgent : a,
          ),
        }));
      },
      deleteAgent: (id: string) => {
        const currentAgents = get().agents;
        const newAgents = currentAgents.filter((t) => t.id !== id);
        set({ agents: newAgents });
      },
    };
    return methods;
  },
  {
    name: StoreKey.Agent,
    version: 0.1,
  },
);
