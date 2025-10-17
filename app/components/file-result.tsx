import React from "react";
import clsx from "clsx";
import { Button } from "./shadcn/button";
import CircleProgress from "./circle-progress";
import PDFIcon from "@/app/icons/pdf.svg";
import PPTptIcon from "@/app/icons/ppt.svg";
import ExcelIcon from "@/app/icons/excel.svg";
import TxtIcon from "@/app/icons/txt.svg";
import DocxIcon from "@/app/icons/word.svg";
import DefaultFileIcon from "@/app/icons/default-light.svg";
import { UploadedFile } from "@/app/typing";

type SvgComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const fileIconMap: Record<string, SvgComponent> = {
  pdf: PDFIcon as unknown as SvgComponent,
  ppt: PPTptIcon as unknown as SvgComponent,
  pptx: PPTptIcon as unknown as SvgComponent,
  excel: ExcelIcon as unknown as SvgComponent,
  xls: ExcelIcon as unknown as SvgComponent,
  xlsx: ExcelIcon as unknown as SvgComponent,
  txt: TxtIcon as unknown as SvgComponent,
  docx: DocxIcon as unknown as SvgComponent,
  doc: DocxIcon as unknown as SvgComponent,
  default: DefaultFileIcon as unknown as SvgComponent,
};

interface FileResultProps {
  files: UploadedFile[];
  removeFile: (id: string) => void;
}

function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  if (isNaN(bytes) || bytes < 0) return "-";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${parseFloat(value.toFixed(decimals))} ${sizes[i]}`;
}

/**
 * FileResult 组件
 */
export const FileResult: React.FC<FileResultProps> = ({
  files,
  removeFile,
}) => {
  console.log("files", files);
  const inferTypeFromName = (file?: UploadedFile) => {
    const name = file?.name ?? file?.url ?? "";
    const ext = name.split(".").pop()?.toLowerCase();
    return ext || "other";
  };

  const renderFileIcon = (file: UploadedFile) => {
    if (!file.url) {
      return (
        <div className="h-[45px] w-[45px] flex items-center justify-center">
          <CircleProgress progress={file.progress ?? 0} size={36} />
        </div>
      );
    }

    // 已有 url，判断是否图片（显示缩略图）还是文件图标
    const t = (file.type ?? "").toLowerCase();
    const ext = inferTypeFromName(file);

    const isImage =
      t.startsWith("image") ||
      t === "png" ||
      t === "jpg" ||
      t === "jpeg" ||
      t === "gif" ||
      ext === "png" ||
      ext === "jpg" ||
      ext === "jpeg" ||
      ext === "gif";

    const key = t || ext || "default";
    const Icon =
      fileIconMap[key] ??
      fileIconMap[key as keyof typeof fileIconMap] ??
      fileIconMap.default;

    return (
      <div className="flex items-center gap-1.5">
        {isImage ? (
          <div className="w-[35px] h-[35px]">
            <img
              src={file.url}
              className="w-full h-full object-cover"
              alt={file.file.name ?? "uploaded"}
            />
          </div>
        ) : (
          <Icon className="w-[35px] h-[35px]" />
        )}
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="text-[#343839] dark:text-[#EDEDED] truncate max-w-25">
            {file.file.name}
          </div>
          <div className="text-[#6C7275] dark:text-[#A1A1AA] text-[10px]">
            {formatFileSize(file.file.size)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx(
        "absolute top-[1px] left-3 pt-3 flex items-center gap-2.5 w-[calc(100%-24px)] bg-white dark:bg-[#141416]",
        files.length > 0 && "pb-2",
      )}
    >
      {files.map((file) => (
        <div
          key={file.id}
          className="relative bg-[#F3F5F780] dark:bg-[#ffffff20] p-[5px] rounded-md"
        >
          {renderFileIcon(file)}
          <Button
            onClick={() => removeFile(file.id)}
            className="absolute -top-2 -right-2 bg-[#F3F5F7] text-[#343839] rounded-full w-4 h-4 flex-center p-0"
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
};

export default FileResult;
