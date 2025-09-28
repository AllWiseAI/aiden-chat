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
      model?: {
        name: string;
        provider: string;
        endpoint: string;
        apiKey: string | undefined;
      };
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
    model: {
      name: "anthropic/claude-3.7-sonnet",
      provider: "openai",
      endpoint: "https://dev.aidenai.io/llm/openai",
      apiKey: undefined,
    },
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
    model: {
      name: "gpt-4o",
      provider: "openai",
      endpoint: "https://dev.aidenai.io/llm/openai",
      apiKey: undefined,
    },
  },
];

export function createAgent(): Agent {
  const { defaultModel } = useAppConfig.getState();
  const getModelInfo = useAppConfig.getState().getModelInfo;
  const defaultModelInfo = getModelInfo(defaultModel);

  return {
    id: nanoid(),
    name: "",
    avatar: "😃",
    source: "custom",
    description: "",
    prompt: "",
    type: undefined,
    model: {
      name: defaultModel,
      provider: defaultModelInfo.provider,
      endpoint: defaultModelInfo.endpoint!,
      apiKey: undefined,
    },
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
      getAgentsHeader: () => {
        const headers = {} as {
          "Aiden-Text-Model": string;
          "Aiden-Multi-Model": string;
        };
        const agents = get().getAgents();
        // 后续要传用户开启的所有 agent
        const builtInAgent = agents.filter(
          (agent) => agent.source === "builtIn",
        );
        const textAgent = builtInAgent.find((agent) => agent.type === "Text")!;
        const MultiAgent = builtInAgent.find(
          (agent) => agent.type === "Multimodal",
        )!;
        headers["Aiden-Text-Model"] = `${textAgent.model.name}$${
          textAgent.model.provider
        }$${textAgent.model.endpoint}${
          textAgent.model.apiKey ? "$" + textAgent.model.apiKey : ""
        }`;
        headers["Aiden-Multi-Model"] = `${MultiAgent.model.name}$${
          MultiAgent.model.provider
        }$${MultiAgent.model.endpoint}${
          MultiAgent.model.apiKey ? "$" + MultiAgent.model.apiKey : ""
        }`;
        return headers;
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
            const override = {} as {
              avatar?: string;
              model: {
                name: string;
                provider: string;
                endpoint: string;
                apiKey: string | undefined;
              };
            };
            if (
              userOverride[updatedAgent.id] &&
              updatedAgent.avatar !== userOverride[updatedAgent.id].avatar
            ) {
              override.avatar = updatedAgent.avatar;
            }
            if (
              userOverride[updatedAgent.id] &&
              updatedAgent.model.name !==
                (userOverride[updatedAgent.id].model
                  ? userOverride[updatedAgent.id].model!.name
                  : undefined)
            ) {
              override.model = {
                name: updatedAgent.model.name,
                provider: updatedAgent.model.provider,
                endpoint: updatedAgent.model.endpoint,
                apiKey: updatedAgent.model.apiKey,
              };
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
