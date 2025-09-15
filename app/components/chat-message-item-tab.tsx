import { useState } from "react";
import { copyToClipboard, copyFileToClipboard } from "../utils";
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
  return (
    <div className={clsx("flex gap-2.5 mt-2.5", className)}>
      {copied ? (
        <SuccessIcon className="text-[#6C7275] size-5" />
      ) : (
        <CopyIcon
          className="text-[#6C7275] size-5"
          onClick={() => {
            if (typeof content == "string") {
              copyToClipboard(content as string);
            } else {
              for (const c of content) {
                copyFileToClipboard(c);
              }
            }
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 3000);
          }}
        />
      )}
    </div>
  );
}
