"use client";
import { useState } from "react";
import TaskManagement from "./task-management";
import { WindowHeader } from "./window-header";
import { ModelSelect } from "../components/model-select";
import { useAppConfig } from "../store";

export function NewTask() {
  const defaultModel = useAppConfig((s) => s.defaultModel);
  const [model, setModel] = useState<string>(defaultModel);
  const handleModelChange = (model: string) => {
    setModel(model);
  };
  return (
    <div>
      <WindowHeader>
        <ModelSelect mode="custom" onChange={handleModelChange} value={model} />
      </WindowHeader>
      <div className="flex flex-col gap-5 px-15 py-5 border-t border-[#E8ECEF] dark:border-[#232627]/50">
        <TaskManagement model={model} />
      </div>
    </div>
  );
}
