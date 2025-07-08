import { create } from "zustand";

type UpdateStatus =
  | "PENDING"
  | "ERROR"
  | "DONE"
  | "UPTODATE"
  | "UPDATE_AVAILABLE"
  | "INSTALLING";

interface UpdateStore {
  isShowUpdate: boolean;
  isUpdating: boolean;
  isLatest: boolean;
  status?: UpdateStatus;
  error?: string;

  setShowUpdate: (show: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setLatest: (latest: boolean) => void;
  setStatus: (status: UpdateStatus) => void;
  setError: (err: string | undefined) => void;
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  isShowUpdate: false,
  isUpdating: false,
  isLatest: false,
  status: undefined,
  error: undefined,

  setShowUpdate: (show) => set({ isShowUpdate: show }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  setLatest: (latest) => set({ isLatest: latest }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));
