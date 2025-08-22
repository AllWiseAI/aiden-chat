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
import { ProviderIcon } from "./provider-icon";
import { ProviderOption } from "@/app/typing";

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
        (provider) => provider.provider === value,
      );
      onChange(selectdInfo!);
    },
    [onChange, providerList],
  );

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={`w-full border-[#E8ECEF] dark:border-[#232627] ${className}`}
      >
        <SelectValue placeholder="Select provider" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <SelectGroup>
          {providerList.map((provider) => (
            <SelectItem
              key={provider.id}
              value={provider.provider}
              className="w-full! !h-9 hover:bg-[#F3F5F7] dark:hover:bg-black"
            >
              <div className="flex items-center gap-2">
                <ProviderIcon provider={provider.provider} />
                <span>{provider.display}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
