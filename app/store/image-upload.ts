import { create } from "zustand";

export interface UploadedImage {
  id: string;
  url: string;
  progress: number;
  file: File;
}

interface ImageUploadState {
  images: UploadedImage[];
  addImage: (image: UploadedImage) => void;
  updateImage: (id: string, data: Partial<UploadedImage>) => void;
  removeImage: (id: string) => void;
  resetImages: () => void;
}

export const useImageUploadStore = create<ImageUploadState>((set) => ({
  images: [],
  addImage: (image) => set((state) => ({ images: [...state.images, image] })),
  updateImage: (id, data) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...data } : img,
      ),
    })),
  removeImage: (id) =>
    set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
  resetImages: () => set({ images: [] }),
}));
