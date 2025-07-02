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

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ModelSelect = ({
  value,
  onChange,
  disabled = false,
  className = "",
}: ModelSelectProps) => {
  const modelList: ModelOption[] = useAppConfig((state) => state.models);
  if (!modelList.length) {
    return null;
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`w-full ${className} border-0 bg-[#F3F5F780]`}>
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
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
