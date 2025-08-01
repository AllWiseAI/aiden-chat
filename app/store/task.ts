import { StoreKey } from "../constant";
import { Task, ModelHeaderInfo } from "../typing";
import { createPersistStore } from "../utils/store";
import { nanoid } from "nanoid";

export const createDefaultTask = (): Task => ({
  id: nanoid(),
  name: "",
  date: "",
  hour: null,
  minute: null,
  type: "",
  notification: false,
  details: "",
  backendData: {},
  modelInfo: {} as ModelHeaderInfo,
});

const DEFAULT_TASK_STATE = {
  tasks: [] as Task[],
  currentTaskId: "",
};

export const useTaskStore = createPersistStore(
  DEFAULT_TASK_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }
    const methods = {
      createTask: (task: Partial<Task> = {}) => {
        const newTask: Task = {
          ...createDefaultTask(),
          ...task,
        };

        set({
          tasks: [...get().tasks, newTask],
          currentTaskId: newTask.id,
        });
      },
      setTask: (id: string, updatedTask: Task) => {
        const tasks = get().tasks.map((t) =>
          t.id === id ? { ...updatedTask, id } : t,
        );
        set({ tasks });
      },
      setCurrentTaskId: (id: string) => {
        set({ currentTaskId: id });
      },
      deleteTask: (id: string) => {
        const currentTasks = get().tasks;
        const newTasks = currentTasks.filter((t) => t.id !== id);
        set({ tasks: newTasks });
      },
    };
    return methods;
  },
  {
    name: StoreKey.Task,
    version: 1.3,
  },
);
