import { getLang, Locales } from "../locales";
import { DEFAULT_TOPIC, ChatMessage } from "./chat";
import { ModelConfig, useAppConfig } from "./config";
import { nanoid } from "nanoid";

export type Mask = {
  id: string;
  createdAt: number;
  avatar: string;
  name: string;
  hideContext?: boolean;
  context: ChatMessage[];
  syncGlobalConfig?: boolean;
  modelConfig: ModelConfig;
  lang: Locales;
  builtin: boolean;
  plugin?: string[];
  enableArtifacts?: boolean;
  enableCodeFold?: boolean;
};

export const DEFAULT_MASK_STATE = {
  masks: {} as Record<string, Mask>,
  language: undefined as Locales | undefined,
};

export type MaskState = typeof DEFAULT_MASK_STATE & {
  language?: Locales | undefined;
};

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export const createEmptyMask = () =>
  ({
    id: nanoid(),
    avatar: DEFAULT_MASK_AVATAR,
    name: DEFAULT_TOPIC,
    context: [],
    syncGlobalConfig: true, // use global config as default
    modelConfig: { ...useAppConfig.getState().modelConfig },
    lang: getLang(),
    builtin: false,
    createdAt: Date.now(),
    plugin: [],
  }) as Mask;
