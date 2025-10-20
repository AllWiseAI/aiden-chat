import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AgentList from "./agent-list";
import PlusIcon from "../icons/plus.svg";
import Image from "next/image";
import Textarea from "./textarea";
import { EmojiList } from "./emoji-list";
import { Label } from "./shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "./shadcn/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";
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
import { createAgent, useAgentStore } from "../store";
import {
  AgentTypeArr,
  Agent,
  ModelOption,
  ProviderOption,
  AgentSource,
  AgentTypeEnum,
} from "../typing";
import { Theme } from "@/app/store";
import { useTheme } from "../hooks/use-theme";
import { useAppConfig } from "../store";
import clsx from "clsx";

interface AgentItemProps {
  item: Agent;
  onEdit: (item: AgentItemProps["item"]) => void;
}

interface UserModel {
  model: string;
  provider: string;
  endpoint: string;
  apiKey: string | undefined;
  logo_uri: undefined;
  display: string;
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
  const isDefault = item
    ? item.source === "builtIn" || item.source === "default"
    : false;
  const [models, localProviders] = useAppConfig((s) => [
    s.models,
    s.localProviders,
  ]);

  const formatLocalModels: UserModel[] = localProviders.flatMap((item) =>
    item.models.map((model) => ({
      model: model.value,
      provider: item.provider,
      endpoint: item.default_endpoint,
      apiKey: item.apiKey,
      logo_uri: undefined,
      display: model.value,
    })),
  );

  const [openPop, setOpenPop] = useState(false);
  const [addAgent, updateAgent] = useAgentStore((state) => [
    state.addAgent,
    state.updateAgent,
  ]);
  const [newAgent, setNewAgent] = useState<AgentItemProps["item"]>(
    createAgent(),
  );
  const modelList = useMemo(() => {
    if (newAgent.type === undefined) return [];
    const isMulti = newAgent.type === AgentTypeEnum.Multimodal;
    return [
      ...(isMulti
        ? models.filter((item) => item.multi_model === true)
        : models),
      ...formatLocalModels,
    ];
  }, [newAgent.type]);

  const currentModel = useMemo(() => {
    return modelList.find((item) => item.model === newAgent.model.name);
  }, [newAgent.model, modelList]);

  useEffect(() => {
    if (item) {
      const {
        id,
        name,
        avatar,
        source,
        description,
        prompt,
        type,
        model,
        enabled,
      } = item;
      setNewAgent({
        id,
        name,
        avatar,
        source,
        type,
        description,
        prompt,
        model,
        enabled,
      });
    }
  }, [item]);

  const renderProviderIcon = useCallback(
    (model: ModelOption | ProviderOption | UserModel, size?: number) => {
      if (model?.logo_uri) {
        return (
          <Image
            src={
              (theme === Theme.Light ? model.logo_uri : model.dark_logo_uri) ??
              ""
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
            provider={model?.provider ?? ""}
            className={size ? `size-[${size}px]` : "size-4.5"}
          />
        </>
      );
    },
    [theme],
  );

  const handleConfirm = () => {
    const nextAgent = {
      ...newAgent,
      name: newAgent.name?.trim()
        ? newAgent.name
        : t("settings:agent.defaultName"),
    };

    if (item) {
      updateAgent(nextAgent);
    } else addAgent(nextAgent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <div className="fixed inset-0 w-screen h-screen bg-black/80 dark:bg-[#141718]/75"></div>
      <DialogContent
        className="flex flex-col gap-5 items-center max-h-[max(80vh,648px)] px-0"
        aria-describedby={undefined}
        closeIcon={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="px-6">{t("dialog.agent.title")}</DialogTitle>
        <div className="flex-1 flex flex-col gap-4 w-full text-sm font-normal scroll-container pl-6 pr-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="avatar" className="text-[#6C7275] w-max">
              {t("dialog.agent.avatar.title")}
            </Label>
            <div className="flex gap-1.5 h-9">
              <div className="flex-center cursor-default size-9 bg-[#F3F5F7] dark:bg-[#232627] rounded-sm">
                {newAgent.avatar}
              </div>
              <Popover open={openPop} onOpenChange={setOpenPop}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={clsx(
                      "w-55 h-full dark:hover:bg-[#232627]/50",
                      openPop
                        ? "border-main dark:border-[#00D47E] text-main hover:text-[#00AB66] dark:hover:text-[#00D47E]"
                        : "dark:border-[#232627]",
                    )}
                  >
                    {t("dialog.agent.avatar.change")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-max">
                  <EmojiList
                    className="max-h-82"
                    value={newAgent.avatar}
                    onChange={(emoji) => {
                      setNewAgent((agent) => {
                        return { ...agent, avatar: emoji };
                      });
                      setOpenPop(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="name"
              className="text-[#6C7275] dark:text-[#E8ECEF] w-max"
            >
              {t("dialog.agent.name")}
            </Label>
            {isDefault ? (
              <div className="bg-[#F3F5F7]/50 dark:bg-[#141718]/50 leading-7 rounded-sm h-9 px-3 py-1 border border-[#E8ECEF] dark:border-[#232627]">
                {newAgent.name}
              </div>
            ) : (
              <Input
                id="name"
                value={newAgent.name}
                onChange={(e) => {
                  setNewAgent((agent) => {
                    return { ...agent, name: e.target.value };
                  });
                }}
                className="!text-left border-[#E8ECEF] dark:border-[#232627] focus:border-[#00AB66] dark:focus:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="description"
              className="text-[#6C7275] dark:text-[#E8ECEF] w-max gap-1 after:content-['*'] after:text-red-500"
            >
              {t("dialog.agent.description")}
            </Label>
            {isDefault ? (
              <div className="bg-[#F3F5F7]/50 dark:bg-[#141718]/50 rounded-sm max-h-40 overflow-y-auto px-3 py-1 border border-[#E8ECEF] dark:border-[#232627]">
                {newAgent.description}
              </div>
            ) : (
              <Textarea
                className="bg-transparent placeholder:text-[#6C7275]/50 dark:placeholder:text-[#E8ECEF]/50 rounded-sm px-3 py-[7.2px] resize-none border border-[#E8ECEF] dark:border-[#232627] focus:border-[#00AB66] dark:focus:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
                rows={1}
                id="description"
                value={newAgent.description}
                onChange={(e) => {
                  setNewAgent((agent) => {
                    return { ...agent, description: e.target.value };
                  });
                }}
              />
            )}
          </div>
          {newAgent.source !== AgentSource.BuiltIn && (
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="prompt"
                className="text-[#6C7275] dark:text-[#E8ECEF] w-max gap-1 after:content-['*'] after:text-red-500"
              >
                {t("dialog.agent.prompt")}
              </Label>
              {isDefault ? (
                <div className="bg-[#F3F5F7]/50 dark:bg-[#141718]/50 rounded-sm max-h-40 overflow-y-auto px-3 py-1 border border-[#E8ECEF] dark:border-[#232627]">
                  {newAgent.prompt}
                </div>
              ) : (
                <Textarea
                  className="bg-transparent placeholder:text-[#6C7275]/50 dark:placeholder:text-[#E8ECEF]/50 rounded-sm px-3 py-[7.2px] resize-none border border-[#E8ECEF] dark:border-[#232627] focus:border-[#00AB66] dark:focus:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
                  rows={1}
                  id="prompt"
                  value={newAgent.prompt}
                  onChange={(e) => {
                    setNewAgent((agent) => {
                      return { ...agent, prompt: e.target.value };
                    });
                  }}
                />
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="type"
              className="text-[#6C7275] dark:text-[#E8ECEF] w-max gap-1 after:content-['*'] after:text-red-500"
            >
              {t("dialog.agent.type")}
            </Label>
            {isDefault ? (
              <div className="bg-[#F3F5F7]/50 dark:bg-[#141718]/50 rounded-sm h-9 px-3 py-2 border border-[#E8ECEF] dark:border-[#232627]">
                {newAgent.type}
              </div>
            ) : (
              <Select
                value={AgentTypeArr.find(
                  (key) =>
                    AgentTypeEnum[key as keyof typeof AgentTypeEnum] ===
                    newAgent.type,
                )}
                onValueChange={(value: string) =>
                  setNewAgent((agent) => {
                    return {
                      ...agent,
                      type: AgentTypeEnum[value as keyof typeof AgentTypeEnum],
                    };
                  })
                }
              >
                <SelectTrigger
                  id="type"
                  className="w-full border-[#E8ECEF] dark:border-[#232627] data-[state=open]:border-[#00AB66] dark:data-[state=open]:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50 border-[#E8ECEF] dark:border-[#232627]">
                  <SelectGroup className="flex flex-col p-2 gap-3">
                    {AgentTypeArr.map((item) => {
                      return (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="model"
              className="text-[#6C7275] dark:text-[#E8ECEF] w-max gap-1 after:content-['*'] after:text-red-500"
            >
              {t("dialog.agent.model")}
            </Label>
            <Select
              value={newAgent.model.name}
              onValueChange={(value) =>
                setNewAgent((agent) => {
                  const modelInfo = modelList.find(
                    (item) => item.model === value,
                  )!;
                  return {
                    ...agent,
                    model: {
                      name: value,
                      provider: modelInfo.provider,
                      endpoint: modelInfo.endpoint,
                      apiKey:
                        "apiKey" in modelInfo ? modelInfo.apiKey : undefined,
                    },
                  };
                })
              }
            >
              <SelectTrigger
                id="model"
                className="w-full border-[#E8ECEF] dark:border-[#232627] data-[state=open]:border-[#00AB66] dark:data-[state=open]:border-[#00AB66] hover:border-[#232627]/50 dark:hover:border-white"
              >
                <SelectValue>
                  {newAgent.type &&
                    currentModel &&
                    renderProviderIcon(currentModel)}
                  {currentModel?.display}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-h-10 max-h-50 border-[#E8ECEF] dark:border-[#232627]">
                <SelectGroup>
                  {modelList.map((item) => {
                    if (item.model)
                      return (
                        <SelectItem key={item.model} value={item.model}>
                          {renderProviderIcon(item)}
                          {item.display}
                        </SelectItem>
                      );
                  })}
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

          <Button
            className="flex-1 rounded-sm"
            disabled={
              !newAgent.description ||
              (newAgent.source !== AgentSource.BuiltIn && !newAgent.prompt) ||
              !newAgent.type ||
              !newAgent.model
            }
            onClick={() => handleConfirm()}
          >
            {t("dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AgentManagement() {
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("settings");
  const [selectedItem, setSelectedItem] = useState<
    AgentItemProps["item"] | null
  >(null);
  const params = useSearchParams();
  const [searchParams] = params;
  const id = searchParams.get("id");

  const agents = useAgentStore((state) => state.getAgents());

  useEffect(() => {
    if (id) {
      const found = agents.find((item) => item.id === id);
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
    <>
      <div className="h-full @container">
        <div className="flex justify-between items-center mb-4">
          <p className="font-medium">{t("agent.title")}</p>
          <Button
            onClick={handleAddAgent}
            className="flex items-center gap-2 h-7 bg-[#00AB66]/12 dark:bg-[#00D47E]/6 hover:bg-[#BEF0DD] dark:hover:bg-[#00D47E]/12 text-main text-sm font-normal rounded-sm"
          >
            <PlusIcon className="size-4" />
            <span>{t("agent.add")}</span>
          </Button>
        </div>
        <AgentList
          onEdit={(agent) => {
            setSelectedItem(agent);
            setShowEdit(true);
          }}
        />
      </div>
      {showEdit && (
        <AgentEditDialog
          open={showEdit}
          item={selectedItem}
          onOpenChange={(open: boolean) => {
            setShowEdit(open);
            // 清除路由上的id
            if (!open && id) {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("id");
              navigate({ search: params.toString() }, { replace: true });
            }
          }}
        />
      )}
    </>
  );
}
