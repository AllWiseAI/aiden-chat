import React, { useRef, useEffect } from "react";
import { useFileUpload } from "@/app/hooks/use-file-upload";
import { Button } from "@/app/components/shadcn/button";
import FileIcon from "../icons/file.svg";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { useChatStore } from "../store";

export const FileUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("general");
  const { uploadFile } = useFileUpload();
  const chatStore = useChatStore();
  const currentSession = chatStore.currentSession();

  const supportImage = currentSession.modelInfo?.multi_model ?? false;
  const supportPDF = currentSession.modelInfo?.support_pdf ?? false;
  const disabled = !supportImage && !supportPDF;

  const validateAndUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error(t("chat.image.tip"));
      return;
    }
    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".pdf",
    ];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      toast.error(t("chat.image.fileTypes"));
      return;
    }
    uploadFile(file);
  };

  const handleSelectFile = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (!e.clipboardData) return;

      const items = Array.from(e.clipboardData.items);
      const files: File[] = [];

      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        files.forEach((file) => validateAndUpload(file));
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [disabled]);

  const renderButton = (disable: boolean) => {
    return (
      <div>
        <Button
          disabled={disable}
          onClick={handleSelectFile}
          variant="outline"
          className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] text-sm font-semibold rounded-sm p-2 size-12"
        >
          <FileIcon className="size-6 text-[#141718] dark:text-white" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={handleFileChange}
        />
      </div>
    );
  };

  const renderUploadImageButton = (disable: boolean) => {
    if (disable) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{renderButton(disable)}</TooltipTrigger>
          <TooltipContent>
            <p>{t("chat.image.disabledTips1")}</p>
            <p>{t("chat.image.disabledTips2")}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return renderButton(disable);
  };

  return <div>{renderUploadImageButton(disabled)}</div>;
};
