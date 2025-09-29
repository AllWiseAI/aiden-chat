import { useNavigate, useLocation } from "react-router-dom";
import { Path } from "../constant";
import { useAppConfig, useChatStore } from "../store";

export function useGetModel() {
  const { pathname } = useLocation();
  const isChat = pathname === Path.Chat;
  const navigate = useNavigate();

  const defaultModel = useAppConfig((state) => state.defaultModel);
  const getModelInfo = useAppConfig((state) => state.getModelInfo);
  const defaultModelInfo = getModelInfo(defaultModel);

  const chatStore = useChatStore();
  const currentSession = chatStore.currentSession()!;
  const updateTargetSession = chatStore.updateTargetSession;

  const updateModel = (newModel: string) => {
    const modelInfo = getModelInfo(newModel);
    if (!modelInfo) return;
    const { messages } = currentSession;
    let hasFile = false;
    messages.forEach((item) => {
      const { content } = item;
      if (Array.isArray(content)) {
        content.forEach((item) => {
          if (item.type === "file_url") {
            hasFile = true;
          }
        });
      }
    });
    if (hasFile) {
      chatStore.newSession(undefined, modelInfo);
      navigate(Path.Chat);
    } else {
      if (isChat) {
        updateTargetSession(currentSession, (session) => {
          session.modelInfo = modelInfo;
        });
      }
    }
  };

  if (isChat && currentSession?.modelInfo) {
    return {
      modelInfo: currentSession.modelInfo,
      updateModel,
      defaultModelInfo,
    };
  }

  return {
    modelInfo: defaultModelInfo,
    updateModel,
    defaultModelInfo,
  };
}
