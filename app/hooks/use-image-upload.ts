import { useImageUploadStore } from "@/app/store/image-upload";
import { uploadImageWithProgress } from "@/app/services/file";

export function useImageUpload() {
  const { addImage, updateImage, removeImage } = useImageUploadStore();

  const uploadImage = async (file: File) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newImage = { id, file, url: "", progress: 0 };

    addImage(newImage);

    try {
      const url = await uploadImageWithProgress(file, (percent) => {
        updateImage(id, { progress: percent });
      });
      if (url) {
        updateImage(id, { url: url, progress: 100 });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      removeImage(id);
    }
  };

  return { uploadImage };
}
