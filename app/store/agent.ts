import { StoreKey } from "../constant";
import { useAppConfig } from "../store";
import { Agent } from "../typing";
import { createPersistStore } from "../utils/store";
import { nanoid } from "nanoid";

const DEFAULT_AGENT_STATE = {
  defaultAgents: [] as Agent[], // 后端提供的built-in与default agent
  userOverride: {} as Record<
    string,
    {
      model?: string;
      avatar?: string;
    }
  >, // 用户修改过的的个性化模型配置，用id映射
  customAgents: [] as Agent[],
};

const BUILTIN_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Image Agent",
    avatar: "😝",
    source: "builtIn",
    description:
      "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
    prompt: `You are a senior AI - Powered Product Operations expert with over 5 years of practical experience in tech products (SaaS, mobile, web, etc.). You deeply understand the operational logic of the entire product lifecycle. Your role is to translate product strategies into executable business results via data - driven approaches, cross - team collaboration, user insights, and process optimization, ultimately achieving the alignment of "maximizing product value" and "user/business goals".`,
    type: "Multimodal",
    model: "deepseek-chat",
  },
  {
    id: "2",
    name: "Text Agent",
    avatar: "😝",
    source: "builtIn",
    description:
      "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
    prompt: `You are a senior AI - Powered Product Operations expert with over 5 years of practical experience in tech products (SaaS, mobile, web, etc.). You deeply understand the operational logic of the entire product lifecycle. Your role is to translate product strategies into executable business results via data - driven approaches, cross - team collaboration, user insights, and process optimization, ultimately achieving the alignment of "maximizing product value" and "user/business goals".`,
    type: "Text",
    model: "deepseek-chat",
  },
];

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
        const defaultAgents = BUILTIN_AGENTS;
        set({
          defaultAgents,
        });
      },

      getAgents: (): Agent[] => {
        const { defaultAgents, userOverride, customAgents } = get();
        const handleDefaultAgents = defaultAgents.map((agent) => {
          const override = userOverride[agent.id];
          return override ? { ...agent, ...override } : agent;
        });
        return [...handleDefaultAgents, ...customAgents];
      },
      addAgent: (agent: Agent) => {
        set({ customAgents: [...get().customAgents, agent] });
      },
      getAgentById: (id: string) => {
        const agents = get().getAgents();
        return agents.find((agent) => agent.id === id);
      },
      updateAgent: (updatedAgent: Agent) => {
        if (updatedAgent.source === "custom") {
          const agents = get().getAgents();
          set({
            customAgents: agents.map((a) =>
              a.id === updatedAgent.id ? updatedAgent : a,
            ),
          });
        } else {
          const hasDefaultAgent = get().defaultAgents.find(
            (agent) => agent.id === updatedAgent.id,
          );
          if (hasDefaultAgent) {
            const { userOverride } = get();
            const override = {} as { avatar?: string; model: string };
            if (updatedAgent.avatar !== userOverride[updatedAgent.id]) {
              override.avatar = updatedAgent.avatar;
            }
            if (updatedAgent.model !== userOverride[updatedAgent.id]) {
              override.model = updatedAgent.model;
            }
            set({
              userOverride: {
                ...get().userOverride,
                [updatedAgent.id]: override,
              },
            });
          }
        }
      },
      deleteAgent: (id: string) => {
        const currentAgents = get().customAgents;
        const newAgents = currentAgents.filter((t) => t.id !== id);
        set({ customAgents: newAgents });
      },
    };
    return methods;
  },
  {
    name: StoreKey.Agent,
    version: 0.1,
  },
);
