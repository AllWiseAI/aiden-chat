import { useAgentStore } from "../store";
import Image from "next/image";
import { Theme } from "@/app/store";
import { useMemo, useCallback, useState } from "react";
import { useTheme } from "../hooks/use-theme";
import { ProviderIcon } from "./setting/provider-icon";
import { useAppConfig } from "../store";
import { Agent, AgentSource } from "../typing";
import { Switch } from "./shadcn/switch";
import { Button } from "./shadcn/button";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/shadcn/alert-dialog";
import DeleteIcon from "../icons/delete.svg";

interface AgentItemProps {
  item: Agent;
  onEdit: (item: AgentItemProps["item"]) => void;
  onDelete: (id: string) => void;
}
interface UserModel {
  model: string;
  provider: string;
  endpoint: string;
  apiKey: string | undefined;
  logo_uri: undefined;
  display: string;
}

function AgentItem({ item, onEdit, onDelete }: AgentItemProps) {
  const theme = useTheme();
  const { t } = useTranslation("settings");
  const models = useAppConfig((s) => s.models);
  const localProviders = useAppConfig((s) => s.localProviders);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const isBuiltIn = item.source === AgentSource.BuiltIn;
  const isDefault = item.source === AgentSource.Default;
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

  const modelList = useMemo(() => {
    return [...models, ...formatLocalModels];
  }, [models, formatLocalModels]);

  const currentModel = useMemo(() => {
    return modelList.find((model) => model.model === item.model.name);
  }, [modelList, item.model.name]);

  const handleSwitch = async (checked: boolean) => {
    if (checked !== item.enabled) {
      updateAgent({
        ...item,
        enabled: checked,
      });
    }
  };

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
    <div
      key={item.id}
      className="min-h-38 flex flex-col justify-between gap-4 border border-[#E8ECEF] dark:border-[#232627] rounded-sm px-2.5 py-3"
    >
      <div className="flex gap-2.5">
        <div className="size-7.5 flex-center cursor-default rounded-full bg-[#F3F5F7] dark:bg-[#232627]">
          {item.avatar}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#141718] dark:text-[#FEFEFE]">
              {item.name}
            </span>
            {isBuiltIn ? (
              <div className="bg-[#E8ECEF] dark:bg-[#343839] text-[#6C7275] dark:text-[#E8ECEF] rounded-2xl text-xs w-max px-1.5 py-0.5">
                {t("agent.default")}
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <Switch
                  checked={item.enabled}
                  onCheckedChange={async (checked) => {
                    await handleSwitch(checked);
                  }}
                />
                {!isDefault && (
                  <DeleteIcon
                    className="size-[18px] text-[#EF466F] hover:opacity-80"
                    onClick={() => onDelete(item.id)}
                  />
                )}
              </div>
            )}
          </div>
          <p className="min-h-[3lh] w-full text-xs text-[#6C7275] leading-4.5 break-words line-clamp-3">
            {item.description}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 pl-1.5">
          <div className="shrink-0">{renderProviderIcon()}</div>
          <p className="text-sm">{currentModel?.display}</p>
        </div>
        <Button
          onClick={() => onEdit(item)}
          className="h-7 bg-transparent text-main text-sm font-medium border border-main hover:bg-[#00AB66] dark:hover:bg-[#00D47E] hover:text-[#FEFEFE] dark:hover:text-[#101213]"
        >
          {t("agent.edit")}
        </Button>
      </div>
    </div>
  );
}

export default function AgentList({
  onEdit,
}: {
  onEdit: (agent: AgentItemProps["item"]) => void;
}) {
  const [getAgents, deleteAgent] = useAgentStore((state) => [
    state.getAgents,
    state.deleteAgent,
  ]);
  const agents = [...getAgents()];
  // .sort((a, b) => {
  //   if (a.source === AgentSource.BuiltIn && b.source !== AgentSource.BuiltIn)
  //     return -1;
  //   if (a.source !== AgentSource.BuiltIn && b.source === AgentSource.BuiltIn)
  //     return 1;
  //   if (a.enabled && !b.enabled) return -1;
  //   if (!a.enabled && b.enabled) return 1;
  //   if (a.source === AgentSource.Default && b.source === AgentSource.Custom)
  //     return -1;
  //   if (a.source === AgentSource.Custom && b.source === AgentSource.Default)
  //     return 1;
  //   return 0;
  // });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletedId, setDeletedId] = useState("");
  const { t } = useTranslation("general");
  return (
    <>
      <div className="-mr-2 scroll-container h-full">
        <div className="grid grid-cols-1 @xss:grid-cols-2 @headerMd:grid-cols-3 gap-3.5">
          {agents.map((item) => (
            <AgentItem
              item={item}
              key={item.id}
              onEdit={onEdit}
              onDelete={(id: string) => {
                setShowDeleteDialog(true);
                setDeletedId(id);
              }}
            />
          ))}
        </div>
      </div>
      {
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-sm w-80 dark:text-white gap-5">
            <div className="flex justify-center">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[18px]">
                  {t("dialog.agent.delete.title")}
                </AlertDialogTitle>
              </AlertDialogHeader>
            </div>
            <AlertDialogDescription className="text-sm text-center font-normal text-[#141718] dark:text-white">
              {t("dialog.agent.delete.content")}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel className="flex-1 rounded-sm hover:bg-[#F3F5F74D] border border-[#E8ECEF] dark:border-[#343839] font-medium">
                {t("dialog.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteAgent(deletedId);
                }}
                className="flex-1 bg-[#EF466F] hover:bg-[#EF466F]/75 rounded-sm font-medium"
              >
                {t("dialog.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    </>
  );
}
