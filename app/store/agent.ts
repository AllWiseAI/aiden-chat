import { StoreKey } from "../constant";
import { useAppConfig } from "../store";
import { updateConfig, formatAgents } from "../utils/agent";
import { Agent, AgentTypeEnum, AgentSource, AgentConfig } from "../typing";
import { createPersistStore } from "../utils/store";
import { readAgentConfig } from "@/app/utils/agent";
import { nanoid } from "nanoid";

const DEFAULT_AGENT_STATE = {
  config: null as AgentConfig | null,
};

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
    enabled: false,
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
      init: async () => {
        const config = await readAgentConfig();
        console.log(11111, config);
        set({ config });
        // 后续加后端获取
      },

      getAgents: (): Agent[] => {
        const { config } = get();
        if (!config) return [];
        const agents = config.agents.map((a: any) => ({
          id: a.agent_id,
          name: a.agent_name,
          avatar: a.avatar,
          source: a.source,
          description: a.description,
          prompt: a.prompt,
          type: a.agent_type,
          enabled: a.enabled,
          model: {
            name: a.model_name,
            provider: a.model_provider,
            endpoint: a.endpoint,
            apiKey: a.api_key || undefined,
          },
        }));
        return agents.sort((a, b) => {
          if (
            a.source === AgentSource.BuiltIn &&
            b.source !== AgentSource.BuiltIn
          )
            return -1;
          if (
            a.source !== AgentSource.BuiltIn &&
            b.source === AgentSource.BuiltIn
          )
            return 1;

          if (a.enabled && !b.enabled) return -1;
          if (!a.enabled && b.enabled) return 1;

          return 0;
        });
      },
      addAgent: (agent: Agent) => {
        const config = get().config;
        const newAgents = [...get().getAgents(), agent];
        if (!config) return;
        const newConfig = {
          ...config,
          agents: formatAgents(newAgents),
        };
        set({
          config: newConfig,
        });
        updateConfig(newConfig);
      },
      getAgentById: (id: string) => {
        const agents = get().getAgents();
        return agents.find((agent) => agent.id === id);
      },
      updateAgent: (updatedAgent: Agent) => {
        const config = get().config;
        if (!config) return;
        const agents = get().getAgents();

        const index = get()
          .getAgents()
          .findIndex((item) => item.id === updatedAgent.id);

        const newAgents = agents;
        newAgents[index] = updatedAgent;
        const newConfig = {
          ...config,
          agents: formatAgents(newAgents),
        };
        set({
          config: newConfig,
        });
        updateConfig(newConfig);
      },
      deleteAgent: (id: string) => {
        const config = get().config;
        if (!config) return;
        const agents = get().getAgents();
        if (
          agents.find((item) => item.id === id)?.source !== AgentSource.Custom
        ) {
          return;
        }
        const newAgents = agents.filter((t) => t.id !== id);
        const newConfig = {
          ...config,
          agents: formatAgents(newAgents),
        };
        set({ config: newConfig });
        updateConfig(newConfig);
      },
    };
    return methods;
  },
  {
    name: StoreKey.Agent,
    version: 0.4,
  },
);
