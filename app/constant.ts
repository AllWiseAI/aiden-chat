export const OWNER = "AllWiseAI";
export const REPO = "aiden-chat";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const PLUGINS_REPO_URL = "";
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const CACHE_URL_PREFIX = "/api/cache";
export const UPLOAD_URL = `${CACHE_URL_PREFIX}/upload`;

export enum Path {
  Home = "/",
  Login = "/login",
  Loading = "/loading",
  SignUp = "/signup",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Auth = "/auth",
  Artifacts = "/artifacts",
  ForgotPassword = "/forgot-password",
}

export enum ApiPath {
  Cors = "",
  Artifacts = "/api/artifacts",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum StoreKey {
  Chat = "chat-next-web-store",
  Plugin = "chat-next-web-plugin",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Update = "chat-update",
  Sync = "sync",
  SdList = "sd-list",
  Mcp = "mcp-store",
  Auth = "auth-store",
  Setting = "setting-store",
}

export const DEFAULT_SIDEBAR_WIDTH = 240;
export const MAX_SIDEBAR_WIDTH = 400;
export const MIN_SIDEBAR_WIDTH = 200;
export const NARROW_SIDEBAR_WIDTH = 72;

export const ACCESS_CODE_PREFIX = "nk-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "aidenchat-storage";

// TODO: temporary set to 2 minutes, will be changed to 10 seconds in the future
export const REQUEST_TIMEOUT_MS = 120000;
export const REQUEST_TIMEOUT_MS_FOR_THINKING = REQUEST_TIMEOUT_MS * 5;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang

export const DEFAULT_SYSTEM_TEMPLATE = `
You are AidenAI. You are a very intelligent, multi-agent assistant. You can simplify complex tasks and enhance productivity. Feel free to ask for help from other agents when needed.
`;

export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;
export const SAAS_CHAT_UTM_URL = "";

export const BASE_URL = "http://127.0.0.1:6888";
export const DEFAULT_CHAT_URL = "http://127.0.0.1:6888/agent/chat";
export const SECOND_CHAT_URL = "http://127.0.0.1:6888/agent/continue-tool-call";
export const HOST_SERVER_READY_EVENT = "host_server_ready";

export const DEFAULT_USER_DELINETED = "User declined the tool call.";
