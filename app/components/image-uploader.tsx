import React, { useRef } from "react";
import { useImageUpload } from "@/app/hooks/use-image-upload";
import { Button } from "@/app/components/shadcn/button";
import FileIcon from "../icons/file.svg";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const ImageUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("general");
  const { uploadImage } = useImageUpload();

  const handleSelectFile = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("file", file);
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

  return (
    <div>
      <Button
        onClick={handleSelectFile}
        variant="outline"
        className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] text-sm font-semibold rounded-sm p-2 size-[30px]"
      >
        <FileIcon className="size-4 text-[#141718] dark:text-white" />
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
