"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/shadcn/select";

import { useMemo } from "react";

export type ModelType =
  | "gpt-4o"
  | "deepseek-chat"
  | "claude-3-7-sonnet-20250219"
  | "claude-opus-4-20250514"
  | "gemini-2.5-flash-preview-05-20"
  | "qwen-plus-latest"
  | "qwen-vl-plus-latest";

interface ModelOption {
  label: string;
  value: ModelType;
}

interface ModelSelectProps {
  value: ModelType;
  onChange: (value: ModelType) => void;
  disabled?: boolean;
  className?: string;
}

export const ModelSelect = ({
  value,
  onChange,
  disabled = false,
  className = "",
}: ModelSelectProps) => {
  const models: ModelOption[] = useMemo(
    () => [
      { label: "GPT-4o", value: "gpt-4o" },
      { label: "Deepseek Chat", value: "deepseek-chat" },
      { label: "Claude 3.7 Sonnet", value: "claude-3-7-sonnet-20250219" },
      { label: "Claude Opus 4", value: "claude-opus-4-20250514" },
      { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash-preview-05-20" },
      { label: "Qwen Plus", value: "qwen-plus-latest" },
      { label: "Qwen VL Plus", value: "qwen-vl-plus-latest" },
    ],
    [],
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`w-full ${className} border-0 bg-[#F3F5F780]`}>
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {models.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
