import React from "react";
import clsx from "clsx";
import { UploadedFile } from "@/app/typing";
import { FileItem } from "./file-item";
import { open } from "@tauri-apps/plugin-shell";

interface FileResultProps {
  files: UploadedFile[];
  removeFile: (id: string) => void;
}

export const FileResult = React.forwardRef<HTMLDivElement, FileResultProps>(
  ({ files, removeFile }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "absolute top-[1px] left-3 pt-3 flex flex-wrap items-center gap-2.5 w-[calc(100%-24px)] bg-white dark:bg-[#141416]",
          files.length > 0 && "pb-2",
        )}
      >
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            removeFile={removeFile}
            onClick={() => {
              if (file.url) {
                open(file.url);
              }
            }}
          />
        ))}
      </div>
    );
  },
);

FileResult.displayName = "FileResult";
