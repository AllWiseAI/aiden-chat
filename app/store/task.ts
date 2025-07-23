import { StoreKey } from "../constant";
import { Task } from "../typing";
import { createPersistStore } from "../utils/store";

export const createDefaultTask = (): Task => ({
  name: "",
  schedule: {
    date: undefined,
    time: "",
  },
  type: "",
  notification: false,
  details: "",
});

const DEFAULT_TASK_STATE = {
  tasks: [] as Task[],
};

export const useTaskStore = createPersistStore(
  DEFAULT_TASK_STATE,
  (set, get) => ({
    createTask: (task: Partial<Task> = {}) => {
      const newTask: Task = {
        ...createDefaultTask(),
        ...task,
      };
      set({
        tasks: [...get().tasks, newTask],
      });
    },
  }),
  {
    name: StoreKey.Task,
    version: 1,
  },
);
