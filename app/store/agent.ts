import { StoreKey } from "../constant";
import { useAppConfig } from "../store";
import { Agent, AgentTypeEnum, AgentSource } from "../typing";
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
    id: "default-multi-model-agent",
    name: "Artist",
    avatar: "👩🏻‍💻",
    source: AgentSource.BuiltIn,
    description:
      "Specialized image agent for processing and generating visual content. Capabilities include: image analysis, image generation, visual content creation, and any task involving image processing.",
    prompt: "",
    type: AgentTypeEnum.Multimodal,
    model: {
      name: "google/gemini-2.5-flash-image-preview",
      provider: "openai",
      endpoint: "https://prod.aidenai.io/llm/openai",
      apiKey: undefined,
    },
  },
  {
    id: "default-text-agent",
    name: "Executor",
    avatar: "👩🏻‍💼",
    source: AgentSource.BuiltIn,
    description:
      "Specialized text agent for processing text conversations, answering questions, providing information, and handling text-based tasks. Capabilities include: text analysis, Q&A, writing assistance, code generation, general conversation, file processing, and document understanding.",
    prompt: "",
    type: AgentTypeEnum.Text,
    model: {
      name: "anthropic/claude-3.7-sonnet",
      provider: "openai",
      endpoint: "https://prod.aidenai.info/llm/openai",
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
    source: AgentSource.Custom,
    description: "",
    prompt: "",
    type: AgentTypeEnum.Multimodal,
    model: {
      name: defaultModel,
      provider: defaultModelInfo!.provider,
      endpoint: defaultModelInfo!.endpoint!,
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
          (agent) => agent.source === AgentSource.BuiltIn,
        );
        const textAgent = builtInAgent.find(
          (agent) => agent.type === AgentTypeEnum.Text,
        )!;
        const multiAgent = builtInAgent.find(
          (agent) => agent.type === AgentTypeEnum.Multimodal,
        )!;
        headers["Aiden-Text-Model"] = `${textAgent.model.name}$${
          textAgent.model.provider
        }$${textAgent.model.endpoint}${
          textAgent.model.apiKey ? "$" + textAgent.model.apiKey : ""
        }`;
        headers["Aiden-Multi-Model"] = `${multiAgent.model.name}$${
          multiAgent.model.provider
        }$${multiAgent.model.endpoint}${
          multiAgent.model.apiKey ? "$" + multiAgent.model.apiKey : ""
        }`;
        return headers;
      },
      updateAgent: (updatedAgent: Agent) => {
        if (updatedAgent.source === AgentSource.Custom) {
          const agents = get()
            .getAgents()
            .filter((item) => item.source === AgentSource.Custom);
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
            if (updatedAgent.avatar) {
              override.avatar = updatedAgent.avatar;
            }
            if (updatedAgent.model) {
              override.model = {
                name: updatedAgent.model.name,
                provider: updatedAgent.model.provider,
                endpoint: updatedAgent.model.endpoint,
                apiKey: updatedAgent.model.apiKey,
              };
            }
            set({
              userOverride: {
                ...userOverride,
                [updatedAgent.id]: {
                  ...get().userOverride[updatedAgent.id],
                  ...override,
                },
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
    version: 0.4,
  },
);
