import {
  DalleQuality,
  DalleStyle,
  ModelSize,
  ModelOption,
  ProviderOption,
} from "../typing";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_SIDEBAR_WIDTH,
  StoreKey,
} from "../constant";
import { createPersistStore } from "../utils/store";
import { getModelList } from "../services/model";
import { v4 as uniqueId } from "uuid";

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

const config = getClientConfig();

export const DEFAULT_CONFIG = {
  localToken: "",
  hostServerPort: 6888,
  debugMode: false,
  lastUpdate: Date.now(), // timestamp, to merge state
  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 15,
  fontFamily: "",
  theme: Theme.Light as Theme,
  tightBorder: !!config?.isApp,
  sendPreviewBubble: true,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  enableArtifacts: true, // show artifacts config

  enableCodeFold: true, // code fold config

  disablePromptHint: false,

  dontShowMaskSplashScreen: true, // dont show splash screen when create chat
  hideBuiltinMasks: false, // dont add builtin masks
  summaryModel: "",
  defaultModel: "",
  models: [] as ModelOption[],
  localProviders: [] as ProviderOption[],
  providerList: [] as ProviderOption[],
  groupedProviders: {} as Record<string, ProviderOption>,

  modelConfig: {
    model: "gpt-4o",
    providerName: "OpenAI",
    temperature: 0.5,
    top_p: 1,
    max_tokens: 40000, // memory related
    presence_penalty: 0,
    frequency_penalty: 0,
    sendMemory: true,
    historyMessageCount: 20, // memory related
    compressMessageLengthThreshold: 1000,
    compressModel: "",
    compressProviderName: "",
    enableInjectSystemPrompts: true,
    template: config?.template ?? DEFAULT_INPUT_TEMPLATE,
    size: "1024x1024" as ModelSize,
    quality: "standard" as DalleQuality,
    style: "vivid" as DalleStyle,
  },
};

export type ChatConfig = typeof DEFAULT_CONFIG;

export type ModelConfig = ChatConfig["modelConfig"];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG },
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }
    const methods = {
      initModelList: async () => {
        const models: ModelOption[] | [] = await getModelList();
        if (models && models.length > 0) {
          set(() => ({
            models,
          }));
          const defaultModel = models?.find((model) => model.is_default)?.model;
          const summaryModel = models?.find((model) => model.is_summary)?.model;

          if (summaryModel) {
            set(() => ({
              summaryModel: summaryModel || defaultModel,
            }));
          }
          if (defaultModel) {
            set(() => ({
              defaultModel,
            }));
          }
        }
      },
      getModelInfo: (modelName: string): ProviderOption | undefined => {
        if (!modelName) {
          return;
        }
        const { groupedProviders, models } = get();
        const res = modelName.split(":");
        if (res.length === 2 && Object.keys(groupedProviders).length > 0) {
          const providerKey = Object.keys(groupedProviders).find(
            (key) => groupedProviders[key]?.provider === res[0],
          );

          const providerInfo = groupedProviders[providerKey!];
          // @ts-ignore
          return {
            ...(providerInfo as Record<string, unknown>),
            model: res[1],
          };
        }
        // @ts-ignore
        return models.find((model) => model.model === modelName);
      },
      setProviderList: async (data: ProviderOption[]) => {
        set(() => ({
          providerList: data,
        }));
      },
      setGroupedProviders: (
        groupedProviders: Record<string, ProviderOption>,
      ) => {
        set(() => ({
          groupedProviders: groupedProviders,
        }));
      },

      getDefaultModel(): ProviderOption {
        const { defaultModel, getModelInfo } = get();
        return getModelInfo(defaultModel) as ProviderOption;
      },
      getSummaryModel() {
        return get().models.find((model) => model.model === get().summaryModel);
      },
      switchDebugMode() {
        const debugMode = get().debugMode;
        set(() => ({
          debugMode: !debugMode,
        }));
      },
      setLocalProviders(providerInfo: ProviderOption) {
        const { localProviders } = get();
        const id = uniqueId();
        set(() => ({
          localProviders: [...localProviders, { ...providerInfo, itemId: id }],
        }));
      },

      updateLocalProviders(providerInfo: ProviderOption) {
        const { localProviders } = get();
        const index = localProviders.findIndex(
          (provider) => provider.itemId === providerInfo.itemId,
        );
        if (index !== -1) {
          localProviders[index] = providerInfo;
        }
      },

      deleteLocalProviders(modelInfo: ProviderOption) {
        const { localProviders } = get();
        const index = localProviders.findIndex(
          (provider) => provider.itemId === modelInfo.itemId,
        );
        if (index !== -1) {
          localProviders.splice(index, 1);
          set(() => ({
            localProviders: [...localProviders],
          }));
        }
      },
      reset() {
        set(() => ({ ...DEFAULT_CONFIG }));
      },
      setHostPort(port: number) {
        set(() => ({
          hostServerPort: port,
        }));
      },
      setLocalToken(token: string) {
        set(() => ({
          localToken: token,
        }));
      },
      setDefaultModel(model: string) {
        set(() => ({
          defaultModel: model,
        }));
      },
      allModels() {},
    };
    return methods;
  },
  {
    name: StoreKey.Config,
    version: 6,
  },
);
