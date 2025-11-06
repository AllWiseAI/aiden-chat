import { FileItem } from "./file-item";
import { UploadedFile } from "@/app/typing";
import { MultimodalContent } from "@/app/client/api";
import { open } from "@tauri-apps/api/shell";

export function ChatMessageItemFile(message: any) {
  if (!Array.isArray(message.message.content)) return null;

  const files = message.message.content
    .filter(
      (item: MultimodalContent) =>
        item.type === "file" || item.type === "image",
    )
    .map((item: MultimodalContent) => item.raw_file_info);

  return (
    <div className="flex flex-wrap gap-3">
      {files.map((file: UploadedFile) => (
        <FileItem
          key={file.id}
          file={file}
          onClick={() => {
            console.log("file.url===", file);
            open(file.url);
          }}
        />
      ))}
    </div>
  );
}
