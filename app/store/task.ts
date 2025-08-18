import { StoreKey } from "../constant";
import { Task } from "../typing";
import { createPersistStore } from "../utils/store";

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
      initTasks: (tasks: Task[]) => {
        set({ tasks });
      },
      addTask: (task: Task) => {
        set({ tasks: [...get().tasks, task] });
      },
      currentTask: () => {
        return get().tasks.find((t) => t.id === get().currentTaskId);
      },
      setTask: (id: string, updatedTask: Task) => {
        const tasks = get().tasks.map((t) =>
          t.id === id ? { ...updatedTask, id } : t,
        );
        set({ tasks });
      },
      updateTargetTask: (targetTask: Task, updater: (task: Task) => void) => {
        const tasks = get().tasks;
        const newTasks = [...tasks];
        const index = newTasks.findIndex((s) => s.id === targetTask.id);
        if (index < 0) return;
        updater(newTasks[index]);
        set(() => ({ tasks: [...newTasks] }));
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
    version: 1.7,
  },
);
