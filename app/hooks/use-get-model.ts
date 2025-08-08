import { useLocation } from "react-router-dom";
import { Path } from "../constant";
import { useAppConfig, useChatStore } from "../store";

export function useGetModel() {
  const { pathname } = useLocation();
  const isChat = pathname === Path.Chat;

  const defaultModel = useAppConfig((state) => state.defaultModel);
  const getModelInfo = useAppConfig((state) => state.getModelInfo);

  const chatStore = useChatStore();
  const currentSession = chatStore.currentSession()!;
  const updateTargetSession = chatStore.updateTargetSession;

  const updateModel = (newModel: string) => {
    const modelInfo = getModelInfo(newModel);
    if (isChat) {
      updateTargetSession(currentSession, (session) => {
        session.modelInfo = modelInfo;
      });
    }
  };

  if (isChat && currentSession?.modelInfo) {
    return {
      modelInfo: currentSession.modelInfo,
      updateModel,
    };
  }

  return {
    modelInfo: getModelInfo(defaultModel),
    updateModel,
  };
}
