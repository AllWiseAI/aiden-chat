import React, { useRef, useEffect } from "react";
import { useFileUpload } from "@/app/hooks/use-file-upload";
import { Button } from "@/app/components/shadcn/button";
import FileIcon from "../icons/file.svg";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { toast } from "@/app/utils/toast";

const validExtensions = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
  pdf: [".pdf"],
  excel: [".xls", ".xlsx"],
  ppt: [".ppt", ".pptx"],
  word: [".doc", ".docx"],
  text: [".txt", ".md", ".markdown"],
};

export const FileUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("general");
  const { uploadFile } = useFileUpload();

  const validateAndUpload = (file: File) => {
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const allValidExtensions = Object.values(validExtensions).flat();

    const isFileValid = allValidExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (!isFileValid) {
      toast.error(t("chat.file.fileTypes"));
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
  }, []);

  const renderButton = () => {
    return (
      <div>
        <Button
          onClick={handleSelectFile}
          variant="outline"
          className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] hover:bg-[#F3F5F7] dark:hover:bg-[#232627] text-sm font-semibold rounded-sm p-2.5 w-9 h-8"
        >
          <FileIcon className="size-[18px] text-[#141718] dark:text-white" />
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

  const renderUploadImageButton = () => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{renderButton()}</TooltipTrigger>
        <TooltipContent>
          <p>{t("chat.file.upload")}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return <div>{renderUploadImageButton()}</div>;
};
