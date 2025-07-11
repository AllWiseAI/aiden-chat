import { DalleQuality, DalleStyle, ModelSize, ModelOption } from "../typing";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_SIDEBAR_WIDTH,
  StoreKey,
} from "../constant";
import { createPersistStore } from "../utils/store";
import { getModelList } from "../services/model";

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
  hostServerPort: 6888,
  debugMode: false,
  lastUpdate: Date.now(), // timestamp, to merge state
  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 14,
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

  currentModel: "",
  models: [] as ModelOption[],
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
  (set, get) => ({
    initModelList: async () => {
      const models: ModelOption[] | [] = await getModelList();
      console.log("[Models]: remote model list", models);
      if (models && models.length > 0) {
        set(() => ({
          models,
        }));
        const defaultModel = models?.find((model) => model.is_default)?.model;
        const { currentModel } = get();
        if (!currentModel) {
          set(() => ({
            currentModel: defaultModel,
          }));
        } else {
          // resolve current model not exist in models
          const isCurrentModelExist = models?.find(
            (model) => model.model === currentModel,
          );
          if (!isCurrentModelExist) {
            set(() => ({
              currentModel: defaultModel,
            }));
          }
        }
      }
    },
    getCurrentModel() {
      return get().models.find((model) => model.model === get().currentModel);
    },
    switchDebugMode() {
      const debugMode = get().debugMode;
      set(() => ({
        debugMode: !debugMode,
      }));
    },
    reset() {
      set(() => ({ ...DEFAULT_CONFIG }));
    },
    setHostPort(port: number) {
      set(() => ({
        hostServerPort: port,
      }));
    },
    setCurrentModel(model: string) {
      set(() => ({
        currentModel: model,
      }));
    },

    allModels() {},
  }),
  {
    name: StoreKey.Config,
    version: 4,
  },
);
