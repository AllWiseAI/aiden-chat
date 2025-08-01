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
import { useCallback, useEffect, useState } from "react";
import { ModelOption, ProviderOption } from "@/app/typing";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import RightIcon from "@/app/icons/right-arrow.svg";
import ArrowDownIcon from "@/app/icons/arrow-down.svg";
import ArrowRightIcon from "@/app/icons/arrow-right.svg";
import { ProviderIcon } from "./setting/provider-icon";
import { INNER_PROVIDER_NAME } from "@/app/constant";

type Props = {
  mode?: "custom" | "inner";
  onChange?: (value: string) => void;
  value?: string;
};

export const ModelSelect = ({ mode = "inner", onChange, value }: Props) => {
  const navigate = useNavigate();
  const setCurrentModel = useAppConfig((s) => s.setCurrentModel);
  const currentModel = useAppConfig((s) => s.currentModel);
  const modelList = useAppConfig((s) => s.models);

  const [bindValue, setBindValue] = useState(value);

  useEffect(() => {
    if (mode === "custom" && value) {
      setBindValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (mode === "inner" && currentModel) {
      setBindValue(currentModel);
    }
  }, [currentModel]);

  const localProviders = useAppConfig((state) => state.localProviders);

  const setGroupedProviders = useAppConfig(
    (state) => state.setGroupedProviders,
  );
  const [groupedLocalProviders, setGroupedLocalProviders] = useState({
    [INNER_PROVIDER_NAME]: {
      id: -1,
      provider: INNER_PROVIDER_NAME,
      models: modelList.map((model) => ({
        ...model,
        value: model.model,
        label: model.display,
      })),
    },
  });

  const formatProvider = (inputData: ProviderOption[]) => {
    const result = inputData.reduce(
      (acc: Record<string, ProviderOption>, item) => {
        const { models, provider, display } = item;

        if (acc[display]) {
          const existingModels = acc[display].models;
          acc[display].models = [
            ...existingModels,
            ...models
              .filter(
                (model) =>
                  !existingModels.some(
                    (existingModel) =>
                      existingModel.value.split(":")[1] === model.value,
                  ),
              )
              .map((model) => ({
                ...model,
                value: `${provider}:${model.value}`,
              })),
          ];
        } else {
          acc[display] = {
            ...item,
            models: models.map((model) => ({
              ...model,
              value: `${provider}:${model.value}`,
            })),
          };
        }

        return acc;
      },
      {},
    );
    return result;
  };

  useEffect(() => {
    const res = formatProvider(localProviders);
    setGroupedProviders(res);
    setGroupedLocalProviders((prev) => ({
      ...prev,
      ...res,
    }));
  }, [localProviders]);

  const [openGroup, setOpenGroup] = useState<string | null>(
    INNER_PROVIDER_NAME,
  );

  useEffect(() => {
    if (currentModel) {
      console.log("currentmodel===", currentModel);
      const res = currentModel.split(":");
      if (res.length === 2) {
        const [provider] = res;
        const labelKey = localProviders.find(
          (item) => item.provider === provider,
        )?.display;
        setOpenGroup(labelKey!);
      } else {
        setOpenGroup(INNER_PROVIDER_NAME);
      }
    }
  }, [currentModel]);

  const handleModelChange = useCallback(
    (value: string) => {
      console.log("value:===", value);
      if (mode === "inner") {
        setCurrentModel(value);
      } else {
        onChange?.(value);
      }
    },
    [setCurrentModel, mode, onChange],
  );

  return (
    <Select value={bindValue} onValueChange={handleModelChange}>
      <SelectTrigger className="w-full border-0 hover:bg-muted/20 dark:hover:bg-muted/30">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="max-h-[320px] dark:bg-[#101213] max-w-56 p-0">
        <div className="overflow-y-auto max-h-[260px] px-1 py-2 space-y-1.5">
          {Object.entries(groupedLocalProviders).map(
            ([groupLabel, provider]) => {
              const isOpen = openGroup === groupLabel;
              const models: ModelOption[] = provider.models;
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
                    <ProviderIcon provider={provider.provider} />
                    <span>{groupLabel}</span>
                  </SelectLabel>
                  <div className={clsx("pl-2", isOpen ? "block" : "hidden")}>
                    {models?.map((model: ModelOption) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="text-sm font-normal truncate max-w-[120px]"
                            title={model.label}
                          >
                            {model.label}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectGroup>
              );
            },
          )}
        </div>

        <div className="border-t px-2 py-2 bg-background">
          <div
            className="cursor-pointer px-2 py-1 bg-muted group rounded flex items-center justify-between"
            onClick={() => navigate(Path.Settings + "?tab=model")}
          >
            <span className="text-sm group-hover:text-[#00AB66]">Manage</span>
            <RightIcon className="size-4 text-muted-foreground group-hover:text-[#00AB66]" />
          </div>
        </div>
      </SelectContent>
    </Select>
  );
};
