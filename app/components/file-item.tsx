import React from "react";

import PDFIcon from "@/app/icons/pdf.svg";
import PPTptIcon from "@/app/icons/ppt.svg";
import ExcelIcon from "@/app/icons/excel.svg";
import TxtIcon from "@/app/icons/txt.svg";
import DocxIcon from "@/app/icons/word.svg";
import DefaultFileIcon from "@/app/icons/default-light.svg";
import { UploadedFile } from "@/app/typing";
import CloseIcon from "@/app/icons/close-file.svg";

type SvgComponent = React.FC<React.SVGProps<SVGSVGElement>>;

function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  if (isNaN(bytes) || bytes < 0) return "-";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${parseFloat(value.toFixed(decimals))} ${sizes[i]}`;
}

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

export function FileItem({
  file,
  removeFile,
  onClick,
}: {
  file: UploadedFile;
  removeFile?: (id: string) => void;
  onClick?: () => void;
}) {
  const inferTypeFromName = (file?: UploadedFile) => {
    const name = file?.file.name ?? file?.url ?? "";
    const ext = name.split(".").pop()?.toLowerCase();
    return ext || "other";
  };

  const renderFileIcon = (file: UploadedFile) => {
    const t = (file.type ?? "").toLowerCase();
    const ext = inferTypeFromName(file);
    const isImage =
      t.startsWith("image") ||
      t === "png" ||
      t === "jpg" ||
      t === "jpeg" ||
      t === "gif" ||
      ext === "png" ||
      ext == "jpg" ||
      ext === "jpeg" ||
      ext === "gif";

    const key = ext || t || "default";
    const Icon =
      fileIconMap[key] ??
      fileIconMap[key as keyof typeof fileIconMap] ??
      fileIconMap.default;

    return (
      <div
        className="flex items-center gap-1.5 cursor-pointer"
        onClick={onClick}
      >
        {isImage && file.url ? (
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
          <div className="text-[#000000] dark:text-[#EDEDED] truncate max-w-25">
            {file.file.name}
          </div>
          <div className="text-[#6C7275] text-[10px]">
            {file.progress !== 100 && (
              <span className="mr-1.5">
                {Math.round(file.progress ?? 10)}%...
              </span>
            )}
            <span>{formatFileSize(file.file.size)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-[#F3F5F780] dark:bg-[#ffffff20] p-[5px] rounded-md">
      {file.progress !== 100 && (
        <div
          className="absolute top-0 left-0 h-full bg-[#E8ECEF] dark:bg-[#343839] transition-all duration-300 z-0 rounded-l-md"
          style={{ width: `${file.progress ?? 0}%` }}
        />
      )}
      <div className="relative z-10">{renderFileIcon(file)}</div>
      {removeFile && (
        <div
          onClick={() => removeFile(file.id)}
          className="cursor-pointer absolute -top-2 -right-2 bg-[#232627] text-[#E8ECEF] dark:bg-[#F3F5F7] dark:text-[#343839] rounded-full w-4 h-4 flex-center p-0"
        >
          <CloseIcon className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}
