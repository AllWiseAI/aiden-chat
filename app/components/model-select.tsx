"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/app/components/shadcn/select";
import clsx from "clsx";
import { useAppConfig } from "../store";
import { useCallback, useState } from "react";
import { ModelOption } from "@/app/typing";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import RightIcon from "@/app/icons/right-arrow.svg";
import ArrowDownIcon from "@/app/icons/arrow-down.svg";
import ArrowRightIcon from "@/app/icons/arrow-right.svg";
import GPTIcon from "@/app/icons/gpt.svg";

export const ModelSelect = () => {
  const navigate = useNavigate();
  const setCurrentModel = useAppConfig((s) => s.setCurrentModel);
  const currentModel = useAppConfig((s) => s.currentModel);
  const modelList = useAppConfig((s) => s.models);

  const mockedCustomModels: ModelOption[] = [
    { model: "custom-model-1", display: "Custom Model 1" },
    { model: "custom-model-2", display: "Custom Model 2" },
  ];

  const grouped: Record<string, ModelOption[]> = {
    "Built-in": modelList.slice(),
    "Custom Provider": mockedCustomModels.slice(),
  };

  const [openGroup, setOpenGroup] = useState<string | null>("Default Provider");

  const handleModelChange = useCallback(
    (value: string) => {
      setCurrentModel(value);
    },
    [setCurrentModel],
  );

  return (
    <Select value={currentModel} onValueChange={handleModelChange}>
      <SelectTrigger className="w-full border-0 hover:bg-muted/20 dark:hover:bg-muted/30">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="max-h-[320px] max-w-56 p-0">
        <div className="overflow-y-auto max-h-[260px] px-1 py-2">
          {Object.entries(grouped).map(([groupLabel, models]) => {
            const isOpen = openGroup === groupLabel;
            return (
              <SelectGroup key={groupLabel}>
                <SelectLabel
                  onClick={() =>
                    setOpenGroup((prev) =>
                      prev === groupLabel ? null : groupLabel,
                    )
                  }
                  className={clsx(
                    "cursor-pointer gap-1 text-xs font-medium px-2 py-1 text-muted-foreground hover:text-foreground transition flex items-center",
                    isOpen ? "text-[#6C7275]" : "text-[#6C727580]",
                  )}
                >
                  {isOpen ? (
                    <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{groupLabel}</span>
                </SelectLabel>
                <div className={clsx("pl-2", isOpen ? "block" : "hidden")}>
                  {models.map((model) => (
                    <SelectItem key={model.model} value={model.model}>
                      <div className="flex items-center justify-center gap-2">
                        <GPTIcon />
                        <div
                          className="text-sm font-normal truncate max-w-[120px]"
                          title={model.display}
                        >
                          {model.display}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectGroup>
            );
          })}
        </div>

        <div className="border-t px-2 py-2 bg-background">
          <div
            className="cursor-pointer px-2 py-1 bg-muted rounded flex items-center justify-between"
            onClick={() => navigate(Path.Settings + "?tab=model")}
          >
            <span className="text-sm">Manage</span>
            <RightIcon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </SelectContent>
    </Select>
  );
};
