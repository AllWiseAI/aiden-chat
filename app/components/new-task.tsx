"use client";
import { useState } from "react";
import TaskManagement from "./task-management";
import { ModelSelect } from "../components/model-select";
import { useAppConfig } from "../store";

export function NewTask() {
  const defaultModel = useAppConfig((s) => s.defaultModel);
  const [model, setModel] = useState<string>(defaultModel);
  const handleModelChange = (model: string) => {
    setModel(model);
  };
  return (
    <div className="flex flex-col gap-5 px-15 py-5">
      <div className="w-fit mb-5">
        <ModelSelect mode="custom" onChange={handleModelChange} value={model} />
      </div>
      <TaskManagement model={model} />
    </div>
  );
}
