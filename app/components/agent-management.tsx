import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import AgentList from "./agent-list";
import PlusIcon from "../icons/plus.svg";
import Image from "next/image";
import Textarea from "./textarea";
import { Label } from "./shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "./shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./shadcn/select";
import { ProviderIcon } from "./setting/provider-icon";
import { Input } from "./shadcn/input";
import { Button } from "./shadcn/button";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { AgentType } from "../constant";
import { Theme } from "@/app/store";
import { useTheme } from "../hooks/use-theme";
import { useAppConfig } from "../store";
import { useGetModel } from "../hooks/use-get-model";

interface AgentItemProps {
  item: {
    id: string;
    name: string;
    avatar: string;
    source: string;
    description: string;
    type: string;
    prompt: string;
    model: string;
  };
  onEdit: (item: AgentItemProps["item"]) => void;
}

function AgentEditDialog({
  open,
  item,
  onOpenChange,
}: {
  open: boolean;
  item: AgentItemProps["item"] | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("general");
  const theme = useTheme();
  const { defaultModelInfo } = useGetModel();
  const modelList = useAppConfig((s) => s.models);
  const [newAgent, setNewAgent] = useState<AgentItemProps["item"]>({
    id: nanoid(),
    name: "",
    avatar: "",
    source: "",
    description: "",
    prompt: "",
    type: "",
    model: defaultModelInfo.model ?? "",
  });
  const currentModel = useMemo(() => {
    return modelList.find((item) => item.model === newAgent.model);
  }, [newAgent.model, modelList]);

  useEffect(() => {
    if (item) {
      const { id, name, avatar, source, description, prompt, type, model } =
        item;
      setNewAgent({
        id,
        name,
        avatar,
        source,
        type,
        description,
        prompt,
        model,
      });
    }
  }, [item]);

  const renderProviderIcon = useCallback(
    (size?: number) => {
      if (currentModel?.logo_uri) {
        return (
          <Image
            src={
              (theme === Theme.Light
                ? currentModel.logo_uri
                : currentModel.dark_logo_uri) ?? ""
            }
            height={size ?? 18}
            width={size ?? 18}
            alt="model"
          ></Image>
        );
      }
      return (
        <>
          <ProviderIcon
            provider={currentModel?.provider ?? ""}
            className={size ? `size-[${size}px]` : "size-4.5"}
          />
        </>
      );
    },
    [currentModel, theme],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-5 items-center max-h-[max(80vh,648px)] px-0"
        aria-describedby={undefined}
        closeIcon={false}
        dismissible={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {newAgent.source !== "default" ? (
          <>
            <DialogTitle className="px-6">Edit Agent</DialogTitle>
            <div className="flex-1 flex flex-col gap-4 w-full text-sm font-normal scroll-container pl-6 pr-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="avatar" className="text-[#6C7275] w-max">
                  Avatar
                </Label>
                <div>111</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-[#6C7275] w-max">
                  Name
                </Label>
                <Input id="name" value={newAgent.name} className="!text-left" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="description"
                  className="text-[#6C7275] w-max gap-1 after:content-['*'] after:text-red-500"
                >
                  Description
                </Label>
                <Textarea
                  className="bg-white dark:bg-[#101213] placeholder:text-[#6C7275]/50 dark:placeholder:text-[#E8ECEF]/50 rounded-sm p-2.5 resize-none border border-[#E8ECEF] dark:border-[#101213] focus:border-[#00AB66] dark:focus:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
                  rows={1}
                  id="description"
                  value={newAgent.description}
                  onChange={(e) => {
                    setNewAgent((agent) => {
                      return { ...agent, description: e.target.value };
                    });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="prompt"
                  className="text-[#6C7275] w-max gap-1 after:content-['*'] after:text-red-500"
                >
                  Prompt
                </Label>
                <Textarea
                  className="bg-white dark:bg-[#101213] placeholder:text-[#6C7275]/50 dark:placeholder:text-[#E8ECEF]/50 rounded-sm p-2.5 resize-none border border-[#E8ECEF] dark:border-[#101213] focus:border-[#00AB66] dark:focus:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
                  rows={1}
                  id="prompt"
                  value={newAgent.prompt}
                  onChange={(e) => {
                    setNewAgent((agent) => {
                      return { ...agent, prompt: e.target.value };
                    });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="type"
                  className="text-[#6C7275] w-max gap-1 after:content-['*'] after:text-red-500"
                >
                  Type
                </Label>
                <Select
                  value={newAgent.type}
                  onValueChange={(value) =>
                    setNewAgent((agent) => {
                      return { ...agent, type: value };
                    })
                  }
                >
                  <SelectTrigger id="type" className="w-full border-[#E8ECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-50 border-[#E8ECEF]">
                    <SelectGroup className="flex flex-col p-2 gap-3">
                      {Object.values(AgentType).map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="model"
                  className="text-[#6C7275] w-max gap-1 after:content-['*'] after:text-red-500"
                >
                  Model
                </Label>
                <Select
                  value={newAgent.model}
                  onValueChange={(value) =>
                    setNewAgent((agent) => {
                      return { ...agent, model: value };
                    })
                  }
                >
                  <SelectTrigger id="model" className="w-full border-[#E8ECEF]">
                    <SelectValue>
                      {renderProviderIcon()}
                      {currentModel?.display}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-50 border-[#E8ECEF]">
                    <SelectGroup>
                      {modelList.map((item) => (
                        <SelectItem key={item.model} value={item.model}>
                          {item.display}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-auto ml-auto gap-2.5 w-full max-w-75 h-9 px-6">
              <Button
                className="flex-1 bg-white rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2 mr-0"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t("dialog.cancel")}
              </Button>

              <Button className="flex-1 rounded-sm">
                {t("dialog.confirm")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogTitle className="px-6">Agent Detail</DialogTitle>
            <div className="flex flex-col gap-5 w-full text-sm font-normal scroll-container py-5 pl-10 pr-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full size-7.5 bg-[#F3F5F7]"></div>
                  <span className="text-[#141718] font-medium text-base">
                    {newAgent.name}
                  </span>
                </div>
                <div>{newAgent.description}</div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-[#6C7275]">Type</span>
                  <span className="font-medium text-[#141718] text-base">
                    {newAgent.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C7275]">Model</span>
                  <div className="flex gap-1">
                    {renderProviderIcon(20)}
                    <div className="font-medium text-[#141718] text-base">
                      {currentModel?.display}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AgentManagement() {
  const [showEdit, setShowEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    AgentItemProps["item"] | null
  >(null);
  const params = useSearchParams();
  const [searchParams] = params;
  const id = searchParams.get("id");

  const agentArr = [
    {
      id: "1",
      name: "Multimodal Agent",
      avatar: "",
      source: "default",
      description:
        "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
      prompt: `You are a senior AI - Powered Product Operations expert with over 5 years of practical experience in tech products (SaaS, mobile, web, etc.). You deeply understand the operational logic of the entire product lifecycle. Your role is to translate product strategies into executable business results via data - driven approaches, cross - team collaboration, user insights, and process optimization, ultimately achieving the alignment of "maximizing product value" and "user/business goals".`,
      type: "Multimodal (Image)",
      model: "deepseek-chat",
    },
    {
      id: "2",
      name: "Text Agent",
      avatar: "",
      source: "default",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      prompt: "",
      type: "Multimodal",
      model: "doubao-seed-1.6-250615",
    },
    {
      id: "3",
      name: "Product Manager",
      avatar: "",
      source: "custom",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      prompt: "",
      type: "Multimodal",
      model: "claude-3-7-sonnet-20250219",
    },
    {
      id: "4",
      name: "Coding Assistant",
      avatar: "",
      source: "custom",
      description: "",
      prompt: "",
      type: "Multimodal",
      model: "anthropic/claude-3.7-sonnet",
    },
    {
      id: "5",
      name: "Coding Assistant",
      avatar: "",
      source: "custom",
      description: "",
      prompt: "",
      type: "Multimodal",
      model: "openai/gpt-4o",
    },
    {
      id: "6",
      name: "Strategic Product Manager",
      avatar: "",
      source: "custom",
      description: "",
      prompt: "",
      type: "Multimodal",
      model: "qwen3-32b",
    },
  ];

  useEffect(() => {
    if (id) {
      const found = agentArr.find((item) => item.id === id);
      if (found) {
        setSelectedItem(found);
        setShowEdit(true);
      }
    }
  }, [id]);

  const handleAddAgent = () => {
    setSelectedItem(null);
    setShowEdit(true);
  };

  return (
    <div className="@container">
      <div className="flex justify-between items-center mb-4">
        <p className="font-medium">Aiden Agent</p>
        <Button
          onClick={handleAddAgent}
          className="flex items-center gap-2 h-7 bg-[#00AB66]/12 dark:bg-[#00D47E]/6 hover:bg-[#BEF0DD] dark:hover:bg-[#00D47E]/12 text-main text-sm font-normal rounded-sm"
        >
          <PlusIcon className="size-4" />
          <span>Add Agent</span>
        </Button>
      </div>
      <AgentList
        onEdit={(agent) => {
          setSelectedItem(agent);
          setShowEdit(true);
        }}
      />
      {showEdit && (
        <AgentEditDialog
          open={showEdit}
          item={selectedItem}
          onOpenChange={setShowEdit}
        />
      )}
    </div>
  );
}
