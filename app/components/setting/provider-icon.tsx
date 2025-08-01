import { useAppConfig, Theme } from "@/app/store";
import GPTIcon from "@/app/icons/gpt.svg";
import AnthropicIcon from "@/app/icons/anthropic.svg";
import AnthropicIconDark from "@/app/icons/anthropic-dark.svg";
import GoogleIcon from "@/app/icons/google.svg";
import DefaultAidenIcon from "@/app/icons/default-aiden.svg";

export function ProviderIcon({ provider }: { provider: string }) {
  const theme = useAppConfig((state) => state.theme);
  if (provider === "openai") {
    return <GPTIcon />;
  }
  if (provider === "anthropic") {
    return theme === Theme.Light ? <AnthropicIcon /> : <AnthropicIconDark />;
  }
  if (provider === "gemini") {
    return <GoogleIcon />;
  }

  return <DefaultAidenIcon />;
}
