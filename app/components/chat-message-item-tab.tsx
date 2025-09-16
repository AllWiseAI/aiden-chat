import { useState } from "react";
import { copyToClipboard, copyContentsToClipboard } from "../utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./shadcn/tooltip";
import { useTranslation } from "react-i18next";
import { MultimodalContent } from "../client/api";
import CopyIcon from "../icons/copy.svg";
import SuccessIcon from "../icons/success.svg";
import clsx from "clsx";

export function ChatMessageItemTab({
  content,
  className,
}: {
  content: string | MultimodalContent[];
  className: string;
}) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const handleCopy = () => {
    if (typeof content == "string") {
      copyToClipboard(content as string);
    } else {
      copyContentsToClipboard(content);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <div className={clsx("flex gap-2.5", className)}>
      {copied ? (
        <SuccessIcon className="text-[#6C7275] size-5" />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <CopyIcon
                className="text-[#6C7275] size-5 hover:opacity-70"
                onClick={handleCopy}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("chat.actions.copy")}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
