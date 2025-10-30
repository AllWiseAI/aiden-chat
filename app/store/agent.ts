import { StoreKey } from "../constant";
import { useAppConfig } from "../store";
import {
  updateConfig,
  formatAgents,
  getRemoteAgentList,
  handleRemoteAgentList,
} from "../utils/agent";
import {
  Agent,
  AgentTypeEnum,
  AgentSource,
  AgentConfig,
  ModelOption,
} from "../typing";
import { createPersistStore } from "../utils/store";
import { readAgentConfig } from "@/app/utils/agent";
import { nanoid } from "nanoid";

const DEFAULT_AGENT_STATE = {
  _hasInitialized: false,
  config: null as AgentConfig | null,
  renderAgents: [] as Agent[],
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
      setInit: () => {
        set({ _hasInitialized: true });
      },
      init: async () => {
        const config = await readAgentConfig();
        const remoteAgents = await getRemoteAgentList();
        const { agents, renderAgents } = handleRemoteAgentList(
          config.agents,
          remoteAgents,
        );
        set({
          config: {
            ...config,
            agents,
          },
          renderAgents,
        });
        updateConfig({
          ...config,
          agents,
        });
        get().setInit();
        console.log("[Agent store] init completed");
      },
      reRenderAgentList: async () => {
        console.log("[Agent store] reRenderMcpList");
        const { config } = get();
        if (!config) return;
        const remoteAgents = await getRemoteAgentList();
        const { renderAgents: sortedAgents } = handleRemoteAgentList(
          config.agents,
          remoteAgents,
        );
        set({ renderAgents: sortedAgents });
      },
      addAgent: (agent: Agent) => {
        const config = get().config;
        const newAgents = [...get().renderAgents, agent];
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
        const agents = get().renderAgents;
        return agents.find((agent) => agent.id === id);
      },
      updateAgent: (updatedAgent: Agent) => {
        const config = get().config;
        if (!config) return;
        const agents = get().renderAgents;

        const index = get().renderAgents.findIndex(
          (item) => item.id === updatedAgent.id,
        );

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
        const agents = get().renderAgents;
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
      handleModel: () => {
        // 针对后端删除了 agent 所绑定的模型
        if (!get()._hasInitialized) return;
        const models: ModelOption[] = useAppConfig.getState().models;
        const { renderAgents, updateAgent } = get();
        const agents: Agent[] = renderAgents;
        agents.forEach((agent) => {
          if (models.every((m) => m.model !== agent.model.name)) {
            console.log("[agent handle default model]", agent.model);
            const defaultModel = useAppConfig.getState().defaultModel;
            const defaultModelInfo = useAppConfig
              .getState()
              .getModelInfo(defaultModel);
            agent.model = {
              name: defaultModel,
              provider: defaultModelInfo!.provider,
              endpoint: defaultModelInfo!.endpoint!,
              apiKey: undefined,
            };
            updateAgent(agent);
          }
        });
      },
    };
    return methods;
  },
  {
    name: StoreKey.Agent,
    version: 0.6,
  },
);
