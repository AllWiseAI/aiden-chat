import React, { useRef } from "react";
import { useImageUpload } from "@/app/hooks/use-image-upload";
import { Button } from "@/app/components/shadcn/button";
import FileIcon from "../icons/file.svg";
import { toast } from "sonner";

export const ImageUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);

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

    // MIME 类型检查
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件！");
      return;
    }

    // 可选：扩展名检查
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      toast.error("不支持的图片格式！");
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
        className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#6C7275] text-sm font-semibold p-2"
      >
        <FileIcon />
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
