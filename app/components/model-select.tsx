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
import Image from "next/image";
import clsx from "clsx";
import { useAppConfig, Theme } from "../store";
import { useCallback, useEffect, useState, useMemo } from "react";
import { ModelOption, ProviderOption } from "@/app/typing";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useTheme } from "../hooks/use-theme";
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
  const { modelInfo, updateModel, defaultModelInfo } = useGetModel();
  const modelList = useAppConfig((s) => s.models);
  const getModelInfo = useAppConfig((state) => state.getModelInfo);
  const localProviders = useAppConfig((state) => state.localProviders);
  const setGroupedProviders = useAppConfig(
    (state) => state.setGroupedProviders,
  );
  const theme = useTheme();
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

  const modelValueList = useMemo(() => {
    const list = Object.values(groupedLocalProviders)
      .flatMap((provider) => provider.models)
      .map((item) => {
        return item.value || item.model;
      });
    return list;
  }, [groupedLocalProviders]);

  const currentModelValue = useMemo(() => {
    if (value) {
      return value;
    } else {
      const modelName = modelInfo?.apiKey
        ? `${modelInfo?.provider}:${modelInfo?.model}`
        : modelInfo?.model;
      if (modelValueList.includes(modelName!)) {
        return modelName!;
      }
      return defaultModelInfo?.model ?? "";
    }
  }, [value, modelInfo, defaultModelInfo, modelValueList]);

  const getCustomModelName = (modelInfo: ProviderOption) => {
    const models = modelInfo.models;
    const model = modelInfo.model;
    const customModel = models.find(
      (item) => item.value.split(":")[1] === model,
    );
    return customModel?.label ?? "";
  };

  const currentModelDisplay = useMemo(() => {
    const modelInfo = getModelInfo(currentModelValue!);
    if (modelInfo) {
      return modelInfo.apiKey
        ? getCustomModelName(modelInfo)
        : modelInfo.display;
    }
    return defaultModelInfo?.display ?? "";
  }, [currentModelValue, defaultModelInfo, getModelInfo]);

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
    if (currentModelValue) {
      const res = currentModelValue.split(":");
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
  }, [currentModelValue, localProviders, modelList]);

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

  const renderProviderIcon = useCallback(() => {
    const modelInfo = getModelInfo(currentModelValue);
    if (currentProvider === INNER_PROVIDER_NAME) {
      return (
        <Image
          src={
            (theme === Theme.Light
              ? modelInfo.logo_uri
              : modelInfo.dark_logo_uri) ?? ""
          }
          height={16}
          width={16}
          alt="model"
        ></Image>
      );
    }
    return (
      <>
        <ProviderIcon provider={currentProvider} className="size-5" />
      </>
    );
  }, [currentProvider, currentModelValue, theme, getModelInfo]);

  return (
    <Select value={currentModelValue} onValueChange={handleModelChange}>
      <SelectTrigger className="w-full border-0 hover:bg-muted/20 dark:hover:bg-muted/30 shadow-none text-base">
        <SelectValue placeholder="Select model">
          <div className="flex items-center gap-1">
            {renderProviderIcon()}
            <div>{currentModelDisplay}</div>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className="max-h-[320px] bg-[#FEFEFE] dark:bg-[#141718] select-none w-62.5 p-0"
        style={{
          boxShadow: `
                    0px 0px 24px 4px rgba(0,0,0,0.05),
                    0px 32px 48px -4px rgba(0,0,0,0.2)
                `,
        }}
      >
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
                      isOpen
                        ? "text-[#6C7275] dark:text-[#E8ECEF]"
                        : "text-[#6C7275]/50 dark:text-[#6C7275] hover:text-[#6C7275] dark:hover:text-[#E8ECEF]",
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
                  <div
                    className={clsx(
                      "pl-5",
                      isOpen ? "block space-y-1 mt-1" : "hidden",
                    )}
                  >
                    {models?.map((model: ModelOption) => (
                      <SelectItem
                        key={model.value}
                        value={model.value}
                        className="dark:hover:!bg-[#232627] h-9"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="text-sm text-[#141718] dark:text-[#FEFEFE] font-normal truncate max-w-[170px]"
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
            className="h-7.5 cursor-pointer px-2 py-1 bg-[#E8ECEF]/50 dark:bg-[#232627]/50 group rounded-sm flex items-center justify-between"
            onClick={() => navigate(Path.Settings + "?tab=model")}
          >
            <span className="text-sm font-medium group-hover:text-[#00AB66]">
              Manage
            </span>
            <RightIcon className="size-6 text-muted-foreground group-hover:text-[#00AB66]" />
          </div>
        </div>
      </SelectContent>
    </Select>
  );
};
