"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/shadcn/select";
import { ModelOption } from "@/app/typing";
import { useAppConfig } from "../store";
import { useCallback } from "react";

interface ModelSelectProps {
  disabled?: boolean;
  className?: string;
}

export const ModelSelect = ({
  disabled = false,
  className = "",
}: ModelSelectProps) => {
  const modelList: ModelOption[] = useAppConfig((state) => state.models);

  const setCurrentModel = useAppConfig((state) => state.setCurrentModel);
  const currentModel = useAppConfig((state) => state.currentModel);

  const handleModelChange = useCallback(
    (value: string) => {
      setCurrentModel(value);
    },
    [setCurrentModel],
  );
  if (!modelList.length) {
    return null;
  }

  return (
    <Select
      value={currentModel}
      onValueChange={handleModelChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={`w-full ${className} border-0 hover:bg-[#F3F5F780] data-[state=open]:bg-[#F3F5F780] dark:hover:bg-[#23262780] dark:data-[state=open]:bg-[#23262780]`}
      >
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="max-h-60 max-w-50">
        <SelectGroup>
          {modelList.map((model) => (
            <SelectItem key={model.model} value={model.model}>
              {model.display}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
