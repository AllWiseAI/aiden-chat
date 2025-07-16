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

interface ModelInfo {
  provider: string;
  apiKey: string;
  model: string;
}

interface AddModelModalProps {
  open: boolean;
  isEdit: boolean;
  modelInfo?: ModelInfo;
  onConfirm: (updated: ModelInfo) => void;
  onOpenChange?: (open: boolean) => void;
}

type ProviderOption = {
  name: string;
  value: string;
  models: { model: string; display: string }[];
};

const providerList = [
  {
    name: "OpenAI",
    value: "openai",
    models: [
      { model: "gpt-4", display: "GPT-4" },
      { model: "gpt-4-turbo", display: "GPT-4 Turbo" },
      { model: "gpt-3.5-turbo", display: "GPT-3.5 Turbo" },
      { model: "gpt-3.5", display: "GPT-3.5" },
      { model: "text-davinci-003", display: "Text Davinci 003" },
    ],
  },
  {
    name: "Anthropic",
    value: "anthropic",
    models: [
      { model: "claude-3-opus-20240229", display: "Claude 3 Opus" },
      { model: "claude-3-sonnet-20240229", display: "Claude 3 Sonnet" },
      { model: "claude-3-haiku-20240307", display: "Claude 3 Haiku" },
      { model: "claude-instant-1.2", display: "Claude Instant 1.2" },
      { model: "claude-2.1", display: "Claude 2.1" },
    ],
  },
  {
    name: "Cohere",
    value: "cohere",
    models: [
      { model: "command-r-plus", display: "Command R+" },
      { model: "command-r", display: "Command R" },
      { model: "command-light", display: "Command Light" },
      { model: "command-nightly", display: "Command Nightly" },
      { model: "embed-english-v3.0", display: "Embed English V3" },
    ],
  },
  {
    name: "Google",
    value: "google",
    models: [
      { model: "gemini-1.5-pro", display: "Gemini 1.5 Pro" },
      { model: "gemini-1.5-flash", display: "Gemini 1.5 Flash" },
      { model: "gemini-1.0-pro", display: "Gemini 1.0 Pro" },
      { model: "palm-2-chat-bison", display: "PaLM 2 Chat Bison" },
      { model: "text-bison", display: "Text Bison" },
    ],
  },
  {
    name: "Azure",
    value: "azure",
    models: [
      { model: "azure-gpt-35", display: "Azure GPT-3.5" },
      { model: "azure-gpt-4", display: "Azure GPT-4" },
      { model: "azure-gpt-4-vision", display: "Azure GPT-4 Vision" },
      { model: "azure-embedding-ada", display: "Azure Embedding Ada" },
      { model: "azure-davinci", display: "Azure Davinci" },
    ],
  },
  {
    name: "HuggingFace",
    value: "huggingface",
    models: [
      { model: "mistral-7b", display: "Mistral 7B" },
      { model: "mixtral-8x7b", display: "Mixtral 8x7B" },
      { model: "llama-3-8b", display: "LLaMA 3 8B" },
      { model: "llama-3-70b", display: "LLaMA 3 70B" },
      { model: "bloomz", display: "BloomZ" },
    ],
  },
];

export function AddModelModal({
  open,
  isEdit,
  onConfirm,
  onOpenChange,
}: AddModelModalProps) {
  const { t: tInner } = useTranslation("settings");
  const [currentModels, setCurrentModels] = useState(providerList[0].models);
  // const [providerList, setProviderList] = useState<ProviderOption[]>([]);
  useEffect(() => {
    async function getProviderData() {
      const data = await getProviderList();
      console.log("data===", data);
    }
    getProviderData();
  }, []);

  const handleConfirm = useCallback(() => {
    const updated: ModelInfo = {};
    onConfirm(updated);
    onOpenChange?.(false);
  }, []);

  const [formData, setFormData] = useState({
    provider: providerList[0].value,
    apiKey: "",
    model: "",
    customUrl: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    console.log("id", id, value);
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleProviderChange = (provider: ProviderOption) => {
    setCurrentModels(provider.models);
    setFormData((prev) => ({
      ...prev,
      ["provider"]: provider.value,
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
              onChange={handleChange}
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
            <MultiSelectDropdown className="flex-1" options={currentModels} />
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
