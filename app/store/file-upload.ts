import { create } from "zustand";
import { UploadedFile } from "@/app/typing";

interface FileUploadState {
  files: UploadedFile[];
  addFile: (file: UploadedFile) => void;
  updateFile: (id: string, data: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
  resetFiles: () => void;
}

export const useFileUploadStore = create<FileUploadState>((set) => ({
  files: [],
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  updateFile: (id, data) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...data } : f)),
    })),
  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  resetFiles: () => set({ files: [] }),
}));
