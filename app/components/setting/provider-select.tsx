"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/shadcn/select";
import { useCallback } from "react";
import GPTIcon from "@/app/icons/gpt.svg";

type ProviderOption = {
  name: string;
  value: string;
  models: { model: string; display: string }[];
};

interface ProviderSelectProps {
  disabled?: boolean;
  value: string;
  className?: string;
  providerList: ProviderOption[];
  onChange: (value: ProviderOption) => void;
}

export const ProviderSelect = ({
  value,
  disabled = false,
  className = "",
  onChange,
  providerList,
}: ProviderSelectProps) => {
  const handleChange = useCallback(
    (value: string) => {
      const selectdInfo = providerList.find(
        (provider) => provider.value === value,
      );
      onChange(selectdInfo);
    },
    [onChange],
  );

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder="Select provider" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <SelectGroup>
          {providerList.map((provider) => (
            <SelectItem
              key={provider.value}
              value={provider.value}
              className="w-full! !h-9"
            >
              <div className="flex items-center gap-2">
                <GPTIcon />
                <span>{provider.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
