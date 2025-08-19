"use client";

import { useCallback, useEffect } from "react";
import useState from "react-usestateref";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/components/shadcn/dialog";
import clsx from "clsx";
import { Button } from "@/app/components/shadcn/button";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import { Label } from "@/app/components/shadcn/label";
import { Password } from "@/app/components/password";
import { ProviderSelect } from "./provider-select";
import { MultiSelectDropdown } from "../shadcn/multi-select";
import {
  ProviderOption,
  CustomModelOption,
  GeminiModelOptions,
  OpenAIModelOptions,
  AnthropicModelOptions,
} from "@/app/typing";
import { fetch } from "@tauri-apps/api/http";
import { useAppConfig } from "@/app/store";
import { toast } from "sonner";

interface ModelInfo {
  provider: string;
  apiKey: string;
  models: [];
  customUrl: string;
}

interface AddModelModalProps {
  open: boolean;
  isEdit: boolean;
  modelInfo?: ModelInfo;
  editInfo?: ProviderOption;
  onConfirm: (updated: ProviderOption) => void;
  onOpenChange?: (open: boolean) => void;
}

export function AddModelModal({
  open,
  isEdit,
  onConfirm,
  editInfo,
  onOpenChange,
}: AddModelModalProps) {
  const { t: tInner } = useTranslation("settings");
  const [modelList, setModelList] = useState<CustomModelOption[]>([]);
  const [isGettingModelLoading, setIsGettingModelLoading] = useState(false);
  const [isModelsError, setIsModelsError] = useState(false);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const [formData, setFormData, formDataRef] = useState({
    provider: "",
    apiKey: "",
    models: [],
    customUrl: "",
  });

  const providerList = useAppConfig((state) => state.providerList);
  useEffect(() => {
    if (providerList && providerList.length) {
      if (!isEdit) {
        setFormData({
          provider: providerList[0].provider,
          apiKey: "",
          models: [],
          customUrl: "",
        });
      }
    }
  }, [providerList]);

  useEffect(() => {
    if (isEdit) {
      initFormData();
    }
  }, []);
  useEffect(() => {
    const { models } = formDataRef.current;
    if (models.length) {
      setIsModelsError(false);
    }
  }, [formDataRef.current]);

  const initFormData = () => {
    const { apiKey, provider, models } = editInfo || {};
    if (apiKey) {
      // @ts-ignore
      setFormData((prev) => {
        const updatedFormData: ModelInfo = {
          ...prev,
          provider: provider || "",
          apiKey: apiKey,
          // @ts-ignore
          models: models?.map((model) => model?.value),
          customUrl: "",
        };
        getModels();

        return updatedFormData;
      });
    }
  };

  const handleConfirm = useCallback(() => {
    const { apiKey, models } = formDataRef.current;
    if (!apiKey || !models.length) {
      if (!models.length) {
        setIsModelsError(true);
      }
      if (!apiKey) {
        setIsApiKeyError(true);
      }
      return;
    }

    setIsApiKeyError(false);
    setIsModelsError(false);
    if (isEdit) {
      onConfirm({
        ...editInfo,
        // @ts-ignore
        models: formDataRef.current.models.map((model: string) =>
          modelList.find((item: CustomModelOption) => item.value === model),
        ),
        apiKey: formDataRef.current.apiKey,
      });
    } else {
      onConfirm({
        ...providerList.find(
          (provider) => provider.provider === formDataRef.current.provider,
        ),
        // @ts-ignore
        models: formDataRef.current.models.map((model: string) =>
          modelList.find((item: CustomModelOption) => item.value === model),
        ),
        apiKey: formDataRef.current.apiKey,
      });
    }
    toast.success(tInner("model.saveSuccess"));
    onOpenChange?.(false);
  }, [formDataRef.current, modelList, isModelsError, isApiKeyError]);

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
      return `Bearer ${formDataRef.current.apiKey}`;
    }

    if (provider === "anthropic") {
      return formDataRef.current.apiKey;
    }
    return formDataRef.current.apiKey;
  };

  const getModels = async () => {
    const apiKey = formDataRef.current.apiKey;
    if (!apiKey) return;
    const providerInfo = providerList.find(
      (provider) => provider.provider === formDataRef.current.provider,
    );
    const { default_endpoint, models_path, headers = {} } = providerInfo || {};
    const requestUrl = `${default_endpoint}${models_path}`;
    const replacedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        // @ts-ignore
        value.includes("api-key") ? formatProviderToken(providerInfo) : value,
      ]),
    );
    setIsGettingModelLoading(true);
    setIsModelsError(false);
    try {
      const modelsReturn = await fetch(requestUrl, {
        method: "GET",
        headers: replacedHeaders,
      });
      setIsGettingModelLoading(false);
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
      } else {
        toast.error("Failed to get models, status code is " + status);
      }
    } catch (error) {
      setModelList([]);
      setIsGettingModelLoading(false);
      console.error("Error fetching models:", error);
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

  const handleApiKeyBlur = () => {
    const { apiKey } = formDataRef.current;
    if (apiKey) {
      setIsApiKeyError(false);
      getModels();
    }
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

        <div className="space-y-5">
          <div className="flex gap-2 w-full">
            <Label
              htmlFor="provider"
              className="font-normal !gap-1 text-sm min-w-14"
            >
              {tInner("model.provider")}
            </Label>

            <ProviderSelect
              value={formData.provider}
              disabled={isEdit}
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
            <div className="flex-1 w-full relative">
              <Password
                id="apiKey"
                type="apiKey"
                placeholder={tInner("model.enterApiKey")}
                className={clsx(
                  "!w-full h-9 !text-left !px-2.5 !py-2 !rounded-sm text-sm border border-[#E8ECEF] !dark:border-[#232627]",
                  isApiKeyError && "!border-[#EF466F]",
                )}
                value={formData.apiKey}
                onChange={handleApiKeyChange}
                onBlur={handleApiKeyBlur}
                required
              />
              {isApiKeyError && (
                <div className="absolute left-0 top-full text-sm text-[#EF466F]">
                  {tInner("model.apiKeyErrorText")}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <Label
              htmlFor="model"
              className="font-normal text-sm !min-w-[56px]"
            >
              {tInner("model.model")}
            </Label>
            <div className="flex flex-col flex-1 gap-2">
              <div
                className={clsx(
                  "w-full rounded-sm border border-[#E8ECEF] dark:border-[#232627]",
                  isModelsError && "border-[#EF466F] dark:border-[#EF466F]",
                )}
              >
                <div className="relative">
                  <MultiSelectDropdown
                    className={clsx("flex-1 w-full max-w-full border-0")}
                    value={formData.models}
                    options={modelList}
                    onChange={handleModelsChange}
                    loading={isGettingModelLoading}
                  />
                  {isModelsError && (
                    <div className="absolute left-0 top-full text-sm text-[#EF466F]">
                      {tInner("model.modelErrorText")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button
              className="bg-white h-9 rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2"
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              {t("dialog.cancel")}
            </Button>
          </DialogClose>
          <Button
            className="flex-1 h-9 rounded-sm bg-[#00D47E] text-white dark:text-black px-2.5 py-2"
            onClick={handleConfirm}
            type="button"
          >
            {t("dialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
