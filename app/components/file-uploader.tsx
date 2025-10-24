import React, { useEffect } from "react";
import { useFileUpload } from "@/app/hooks/use-file-upload";
import { Button } from "@/app/components/shadcn/button";
import FileIcon from "../icons/file.svg";
import { useTranslation } from "react-i18next";
import { useFileUploadStore } from "@/app/store/file-upload";
import {
  allValidExtensions,
  validExtensions,
  isImage,
  isPdf,
} from "@/app/utils/file";

import { open } from "@tauri-apps/api/dialog";
import { readBinaryFile } from "@tauri-apps/api/fs";
import { basename, extname } from "@tauri-apps/api/path";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { toast } from "@/app/utils/toast";

export const FileUploader = () => {
  const { addFile } = useFileUploadStore();

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

  const handleSelectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Documents", extensions: allValidExtensions }],
    });

    if (!selected) return;

    const filePath = Array.isArray(selected) ? selected[0] : selected;
    const fileData = await readBinaryFile(filePath);
    const fileName = await basename(filePath);

    const ext = await extname(filePath);
    const blob = new Blob([fileData]);
    const newFile = new File([blob], fileName);
    if (isPdf(ext) || isImage(ext)) {
      uploadFile(newFile);
    } else {
      const id = Math.random().toString(36).substring(2, 9);
      const file = {
        id,
        file: newFile,
        url: filePath,
        progress: 100,
        type: ext,
      };
      addFile(file);
    }
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
