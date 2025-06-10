import React, { useRef } from "react";
import { useImageUpload } from "@/app/hooks/use-image-upload";
import { Button } from "@/app/components/shadcn/button";

export const ImageUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadImage } = useImageUpload();

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("file", file);
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSelectFile}
        variant="outline"
        className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#6C7275] text-sm font-semibold p-2"
      >
        上传图片
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
