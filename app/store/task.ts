import { StoreKey } from "../constant";
import { Task } from "../typing";
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
      getTask: (id: string) => {
        return get().tasks.find((task) => task.id === id);
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
      setNotification: (id: string) => {
        const tasks = get().tasks;
        const updatedTasks = tasks.map((task) =>
          task.id === id ? { ...task, notification: !task.notification } : task,
        );
        set({ tasks: updatedTasks });
      },
      deleteTask: (index: number) => {
        const currentTasks = get().tasks;
        const newTasks = currentTasks.filter((_, i) => i !== index);
        set({ tasks: newTasks });
      },
    };
    return methods;
  },
  {
    name: StoreKey.Task,
    version: 1,
  },
);
