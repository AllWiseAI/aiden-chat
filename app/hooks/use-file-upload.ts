import { useFileUploadStore } from "@/app/store/file-upload";
import { uploadFileWithProgress } from "@/app/services/file";

export function useFileUpload() {
  const { addFile, updateFile, removeFile } = useFileUploadStore();

  const uploadFile = async (file: File) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newFile = { id, file, url: "", progress: 0, type: "default" };

    addFile(newFile);

    try {
      const { url, type } = await uploadFileWithProgress(file, (percent) => {
        updateFile(id, { progress: percent });
      });
      if (url && type) {
        updateFile(id, { url, type, progress: 100 });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      removeFile(id);
    }
  };

  return { uploadFile };
}
