import React, { useRef } from "react";
import { useImageUpload } from "@/app/hooks/use-image-upload";
import { Button } from "@/app/components/shadcn/button";
import FileIcon from "../icons/file.svg";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { useAppConfig } from "../store";

export const ImageUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("general");
  const { uploadImage } = useImageUpload();
  const currentModel = useAppConfig().getCurrentModel();
  const disabled = currentModel?.multi_model === false;
  const handleSelectFile = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("chat.image.tip"));
      return;
    }

    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      toast.error(t("chat.image.fileTypes"));
      return;
    }
    if (file) {
      uploadImage(file);
    }
  };

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
          accept="image/*"
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
