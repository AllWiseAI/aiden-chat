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

interface ProviderSelectProps {
  disabled?: boolean;
  value: string;
  className?: string;
  onChange: (value: string) => void;
}

export const ProviderSelect = ({
  value,
  disabled = false,
  className = "",
  onChange,
}: ProviderSelectProps) => {
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
  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
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
