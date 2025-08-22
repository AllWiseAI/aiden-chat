import { Theme } from "@/app/store";
import { useTheme } from "../../hooks/use-theme";
import GPTIcon from "@/app/icons/gpt.svg";
import AnthropicIcon from "@/app/icons/anthropic.svg";
import AnthropicIconDark from "@/app/icons/anthropic-dark.svg";
import GoogleIcon from "@/app/icons/google.svg";
import AidenLightIcon from "@/app/icons/default-aiden.svg";
import AidenDarkIcon from "@/app/icons/logo-circle.svg";
import clsx from "clsx";

export function ProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  const theme = useTheme();
  if (provider === "openai") {
    return (
      <GPTIcon className={clsx("text-black dark:text-white", className)} />
    );
  }
  if (provider === "anthropic") {
    return theme === Theme.Light ? (
      <AnthropicIcon className={className} />
    ) : (
      <AnthropicIconDark className={className} />
    );
  }
  if (provider === "gemini") {
    return <GoogleIcon className={className} />;
  }

  return theme === Theme.Light ? (
    <AidenLightIcon className={className} />
  ) : (
    <AidenDarkIcon className={clsx("text-[#00D47E]", className)} />
  );
}
