import { StoreKey } from "../constant";
import { Task, TaskTypeEnum } from "../typing";
import { createPersistStore } from "../utils/store";
import { nanoid } from "nanoid";
import { useAppConfig } from "./config";

export const createDefaultTask = (): Task => {
  const config = useAppConfig.getState();
  const modelInfo = config.getDefaultModel();
  return {
    id: nanoid(),
    name: "",
    date: "",
    hour: null,
    minute: null,
    type: "",
    notification: false,
    details: "",
    backendData: {},
    modelInfo: modelInfo,
    createdAt: Date.now(),
  };
};

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
      getRenderTaskList: () => {
        const tasks = _get().tasks;
        const newestCreatedAt = Math.max(...tasks.map((t) => t.createdAt ?? 0));
        return Object.values(TaskTypeEnum).map((type) => ({
          type,
          tasks: tasks
            .filter((task) => task.type === type)
            .sort((a, b) => {
              if (
                a.createdAt === newestCreatedAt &&
                b.createdAt !== newestCreatedAt
              )
                return -1;
              if (
                b.createdAt === newestCreatedAt &&
                a.createdAt !== newestCreatedAt
              )
                return 1;

              const dateDiff =
                new Date(a.date).getTime() - new Date(b.date).getTime();
              if (dateDiff !== 0) return dateDiff;

              const hourDiff = (a.hour ?? 0) - (b.hour ?? 0);
              if (hourDiff !== 0) return hourDiff;

              return (a.minute ?? 0) - (b.minute ?? 0);
            }),
        }));
      },
    };
    return methods;
  },
  {
    name: StoreKey.Task,
    version: 1.5,
  },
);
