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
import { useCallback, useEffect, useState, useMemo } from "react";
import { ModelOption, ProviderOption } from "@/app/typing";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import RightIcon from "@/app/icons/right-arrow.svg";
import ArrowDownIcon from "@/app/icons/arrow-down.svg";
import ArrowRightIcon from "@/app/icons/arrow-right.svg";
import { ProviderIcon } from "./setting/provider-icon";
import { INNER_PROVIDER_NAME } from "@/app/constant";
import { useGetModel } from "../hooks/use-get-model";

type Props = {
  value?: string;
  mode?: "inner" | "custom";
  onChange?: (modelInfo: string) => void;
};

export const ModelSelect = ({ value, mode = "inner", onChange }: Props) => {
  const navigate = useNavigate();
  const { modelInfo, updateModel, defaultModel } = useGetModel();
  const modelList = useAppConfig((s) => s.models);
  const localProviders = useAppConfig((state) => state.localProviders);
  const setGroupedProviders = useAppConfig(
    (state) => state.setGroupedProviders,
  );
  const [currentProvider, setCurrentProvider] =
    useState<string>(INNER_PROVIDER_NAME);
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

  const modelNameList = useMemo(() => {
    const list = Object.values(groupedLocalProviders)
      .flatMap((provider) => provider.models)
      .map((item) => {
        return item.value;
      });
    return list;
  }, [groupedLocalProviders]);

  const currentModel = useMemo(() => {
    if (value) {
      return value;
    } else {
      const modelName = modelInfo?.apiKey
        ? `${modelInfo?.provider}:${modelInfo?.model}`
        : modelInfo?.model;
      if (modelNameList.includes(modelName!)) {
        return modelName!;
      }
      return defaultModel;
    }
  }, [value, modelInfo, defaultModel, modelNameList]);

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
    setGroupedLocalProviders(() => ({
      ...{
        [INNER_PROVIDER_NAME]: {
          id: -1,
          provider: INNER_PROVIDER_NAME,
          models: modelList.map((model) => ({
            ...model,
            value: model.model,
            label: model.display,
          })),
        },
      },
      ...res,
    }));
  }, [modelList, localProviders, setGroupedProviders]);

  const [openGroup, setOpenGroup] = useState<string | null>(
    INNER_PROVIDER_NAME,
  );

  useEffect(() => {
    if (currentModel) {
      const res = currentModel.split(":");
      if (res.length === 2) {
        const [provider] = res;
        setCurrentProvider(provider);
        const labelKey = localProviders.find(
          (item) => item.provider === provider,
        )?.display;
        setOpenGroup(labelKey!);
      } else {
        setCurrentProvider(INNER_PROVIDER_NAME);
        setOpenGroup(INNER_PROVIDER_NAME);
      }
    }
  }, [currentModel, localProviders, modelList]);

  const handleModelChange = useCallback(
    (value: string) => {
      if (mode === "inner") {
        updateModel(value);
      } else {
        onChange?.(value);
      }
    },
    [mode, updateModel, onChange],
  );

  return (
    <Select value={currentModel} onValueChange={handleModelChange}>
      <SelectTrigger className="w-full border-0 hover:bg-muted/20 dark:hover:bg-muted/30 shadow-none text-base">
        <SelectValue placeholder="Select model">
          <div className="flex items-center gap-1">
            <ProviderIcon provider={currentProvider} className="size-5" />
            <div>{modelInfo?.model}</div>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[320px] bg-[#FEFEFE] dark:bg-[#141718] select-none w-62.5 p-0">
        <div className="max-w-60 overflow-y-auto max-h-[260px] px-1 py-2 space-y-1.5">
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
                    <ProviderIcon
                      provider={provider.provider}
                      className="size-4"
                    />
                    <span>{groupLabel}</span>
                  </SelectLabel>
                  <div className={clsx("pl-5", isOpen ? "block" : "hidden")}>
                    {models?.map((model: ModelOption) => (
                      <SelectItem
                        key={model.value}
                        value={model.value}
                        className="dark:hover:!bg-[#232627]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="text-sm font-normal truncate max-w-[170px]"
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

        <div className="max-w-60 h-max px-2 py-2 bg-[#FEFEFE] dark:bg-[#141718]">
          <div
            className="h-7.5 cursor-pointer px-2 py-1 bg-[#E8ECEF]/50 dark:bg-[#232627]/50 group rounded flex items-center justify-between"
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
