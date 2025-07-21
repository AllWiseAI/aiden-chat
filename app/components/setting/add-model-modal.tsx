"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/components/shadcn/dialog";

import { Button } from "@/app/components/shadcn/button";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import { Label } from "@/app/components/shadcn/label";
import { Password } from "@/app/components/password";
import { ProviderSelect } from "./provider-select";
import { MultiSelectDropdown } from "../shadcn/multi-select";
import { getProviderList } from "@/app/services";
import {
  ProviderOption,
  CustomModelOption,
  GeminiModelOptions,
  OpenAIModelOptions,
  AnthropicModelOptions,
} from "@/app/typing";
import { fetch } from "@tauri-apps/api/http";

interface ModelInfo {
  provider: string;
  apiKey: string;
  model: string;
}

interface AddModelModalProps {
  open: boolean;
  isEdit: boolean;
  modelInfo?: ModelInfo;
  onConfirm: (updated: ProviderOption) => void;
  onOpenChange?: (open: boolean) => void;
}

export function AddModelModal({
  open,
  isEdit,
  onConfirm,
  onOpenChange,
}: AddModelModalProps) {
  const { t: tInner } = useTranslation("settings");
  const [providerList, setProviderList] = useState<ProviderOption[]>([]);
  const [modelList, setModelList] = useState<CustomModelOption[]>([]);
  useEffect(() => {
    async function getProviderData() {
      const data = await getProviderList();
      if (data && data.length) {
        setProviderList(data);
        setFormData({
          provider: data[0].provider,
          apiKey: "",
          models: [],
          customUrl: "",
        });
      }
    }
    getProviderData();
  }, []);

  const [formData, setFormData] = useState({
    provider: "",
    apiKey: "",
    models: [],
    customUrl: "",
  });

  const handleConfirm = useCallback(() => {
    if (!formData.provider || !formData.apiKey || !formData.models) {
      return;
    }
    onConfirm({
      ...providerList.find(
        (provider) => provider.provider === formData.provider,
      ),
      // @ts-ignore
      models: formData.models.map((model: string) =>
        modelList.find((item: CustomModelOption) => item.value === model),
      ),
      apiKey: formData.apiKey,
    });
    onOpenChange?.(false);
  }, [formData]);

  const formatProviderModels = (
    providerInfo: ProviderOption,
    modelsData: [],
  ) => {
    const { provider } = providerInfo || {};
    if (provider === "openai") {
      return modelsData.map((model: OpenAIModelOptions) => ({
        value: model.id,
        label: model.id,
      }));
    }

    if (provider === "anthropic") {
      return modelsData.map((model: AnthropicModelOptions) => ({
        value: model.id,
        label: model.display_name,
      }));
    }

    if (provider === "gemini") {
      return modelsData.map((model: GeminiModelOptions) => ({
        value: model.name,
        label: model.displayName,
      }));
    }

    return [];
  };

  const formatProviderToken = (providerInfo: ProviderOption) => {
    const { provider } = providerInfo || {};
    if (provider === "openai") {
      return `Bearer ${formData.apiKey}`;
    }

    if (provider === "anthropic") {
      return formData.apiKey;
    }
    return formData.apiKey;
  };

  const getModels = async () => {
    const providerInfo = providerList.find(
      (provider) => provider.provider === formData.provider,
    );
    const { default_endpoint, models_path, headers = {} } = providerInfo || {};
    const requestUrl = `${default_endpoint}${models_path}`;
    const apiKey = formData.apiKey;
    if (!apiKey) return;
    const replacedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        // @ts-ignore
        value.includes("api-key") ? formatProviderToken(providerInfo) : value,
      ]),
    );
    const modelsReturn = await fetch(requestUrl, {
      method: "GET",
      headers: replacedHeaders,
    });
    console.log("models data===", modelsReturn);
    const { data, status } = modelsReturn;
    if (status === 200) {
      const models = formatProviderModels(
        // @ts-ignore
        providerInfo,
        // @ts-ignore
        data.data || data.models || [],
      );
      if (models.length) {
        setModelList(models);
      }
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      ["apiKey"]: e.target.value,
    }));
  };

  const handleProviderChange = (provider: ProviderOption) => {
    setFormData((prev) => ({
      ...prev,
      ["apiKey"]: "",
      ["models"]: [],
    }));
    setModelList([]);
    setFormData((prev) => ({
      ...prev,
      ["provider"]: provider?.provider,
    }));
  };

  const handleModelsChange = (models: string[]) => {
    // @ts-ignore
    setFormData((prev) => ({
      ...prev,
      ["models"]: models,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!w-[380px] rounded-sm gap-5 p-5"
        closeIcon={false}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg text-center dark:text-[#FEFEFE]">
            {isEdit
              ? tInner("model.editModelTitle")
              : tInner("model.addModelTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="flex gap-2 w-full">
            <Label
              htmlFor="provider"
              className="font-normal !gap-1 text-sm min-w-14"
            >
              {tInner("model.provider")}
            </Label>

            <ProviderSelect
              value={formData.provider}
              providerList={providerList}
              onChange={handleProviderChange}
            />
          </div>

          <div className="flex gap-2 w-full">
            <Label
              htmlFor="apiKey"
              className="font-normal !gap-1 text-sm min-w-14"
            >
              {tInner("model.apiKey")}
            </Label>
            <Password
              id="apiKey"
              type="apiKey"
              placeholder={t("Enter API Key")}
              className="!w-full h-9 !text-left !px-2.5 !py-2 !rounded-sm text-sm border hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
              value={formData.apiKey}
              onChange={handleApiKeyChange}
              onBlur={getModels}
              required
            />
          </div>

          <div className="flex gap-2 w-full">
            <Label
              htmlFor="model"
              className="font-normal text-sm !min-w-[56px]"
            >
              {tInner("model.model")}
            </Label>
            <MultiSelectDropdown
              className="flex-1"
              options={modelList}
              onChange={handleModelsChange}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button
              className="bg-white h-8 rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2"
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              {t("dialog.cancel")}
            </Button>
          </DialogClose>
          <DialogClose asChild className="flex-1">
            <Button
              className="h-8 rounded-sm bg-[#00D47E] text-white dark:text-black px-2.5 py-2"
              onClick={handleConfirm}
              type="button"
            >
              {t("dialog.save")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
