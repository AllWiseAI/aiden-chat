import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "../components/shadcn/label";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./shadcn/hover-card";
import { Tooltip, TooltipTrigger, TooltipContent } from "./shadcn/tooltip";
import { useAppConfig, useAgentStore } from "../store";
import { Path } from "../constant";
import { Agent } from "../typing";
import { INNER_PROVIDER_NAME } from "@/app/constant";
import { ProviderIcon } from "./setting/provider-icon";
import { ModelOption, ProviderOption, AgentTypeEnum } from "@/app/typing";
import AccessIcon from "../icons/access.svg";
import RightIcon from "../icons/right-arrow.svg";
import ArrowDownIcon from "../icons/arrow-down.svg";
import ArrowRightIcon from "@/app/icons/arrow-right.svg";
import MoreIcon from "../icons/more.svg";
import BlockIcon from "../icons/block.svg";
import clsx from "clsx";

function AgentModel({ show, item }: { show: boolean; item: Agent }) {
  const navigate = useNavigate();
  const { t } = useTranslation("general");
  const [modelList, getModelInfo, setGroupedProviders, localProviders] =
    useAppConfig((s) => [
      s.models,
      s.getModelInfo,
      s.setGroupedProviders,
      s.localProviders,
    ]);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const [openGroup, setOpenGroup] = useState<string | null>(
    INNER_PROVIDER_NAME,
  );
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
  }, [modelList, localProviders]);

  const switchAgentModel = (model: string) => {
    if (model === item.model.name) return;
    const res = getModelInfo(model)!;

    const newAgent = {
      ...item,
      model: {
        name: res.apiKey
          ? res.models.find((item) => item.value === model)!.label
          : model,
        provider: res.provider,
        endpoint: res.apiKey ? res.default_endpoint : res.endpoint,
        apiKey: res.apiKey ?? undefined,
      },
    };
    // @ts-ignore
    updateAgent(newAgent);
  };

  return (
    <div>
      {show && (
        <div className="max-w-60 mx-auto border light:border-[#E8ECEF] rounded-sm overflow-hidden">
          <div className="w-full bg-[#FEFEFE] dark:bg-[#141718] overflow-y-auto max-h-[260px] px-1 py-2 space-y-1.5">
            {Object.entries(groupedLocalProviders).map(
              ([groupLabel, provider]) => {
                const isOpen = openGroup === groupLabel;
                const isMulti = item.type === AgentTypeEnum.Multimodal;
                // @ts-ignore
                const models: ModelOption[] = provider.apiKey
                  ? provider.models.map((model) => ({
                      model: model.value,
                      label: model.label,
                    }))
                  : isMulti
                  ? provider.models.filter(
                      (model) => model.multi_model === true,
                    )
                  : provider.models;

                return (
                  <div key={groupLabel}>
                    <Label
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
                    </Label>
                    <div
                      className={clsx(
                        "pl-5",
                        isOpen ? "block space-y-1 mt-1" : "hidden",
                      )}
                    >
                      {models?.map((model: ModelOption) => (
                        <div
                          key={model.value}
                          className="cursor-default hover:bg-[#F3F5F7] dark:hover:bg-[#232627] p-2 h-9 flex items-center justify-between gap-2"
                          onClick={() => switchAgentModel(model.model)}
                        >
                          <div
                            className="text-sm text-[#141718] dark:text-[#FEFEFE] font-normal truncate max-w-[170px]"
                            title={model.label}
                          >
                            {model.label}
                          </div>
                          {(model.model.split(":")[1] ?? model.model) ===
                            item.model.name && (
                            <AccessIcon className="size-4 text-main" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div className="w-full h-max px-2 py-2 bg-[#FEFEFE] dark:bg-[#141718]">
            <div
              className="h-7.5 cursor-pointer px-2 py-1 bg-[#E8ECEF]/50 dark:bg-[#232627]/50 group rounded-sm flex items-center justify-between"
              onClick={() => navigate(Path.Settings + "?tab=model")}
            >
              <span className="text-sm font-medium group-hover:text-[#00AB66]">
                {t("ui.manage")}
              </span>
              <RightIcon className="size-6 text-muted-foreground group-hover:text-[#00AB66]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentTab() {
  const navigate = useNavigate();
  const agents = useAgentStore((state) => state.getAgents());
  const getModelInfo = useAppConfig((s) => s.getModelInfo);
  const [showModel, setShowModel] = useState(false);
  const MAX_AGENT_COUNT = 10;
  const { t } = useTranslation("settings");
  return (
    <div className="flex items-center">
      {agents
        .filter((item) => item.enabled)
        .slice(0, MAX_AGENT_COUNT)
        .map((item) => (
          <HoverCard key={item.id} openDelay={200}>
            <HoverCardTrigger asChild>
              <div
                className={clsx(
                  "group cursor-default flex-center rounded-full backdrop-blur-lg border hover:border-[#00D47E] dark:hover:border-[#4ADE80] data-[state=open]:border-[#00D47E] dark:data-[state=open]:border-[#00D47E] size-8 hover:size-10 transition-all duration-500 ease-in-out data-[state=open]:size-10 -mr-2 flex-center data-[state=open]:z-1",
                )}
                style={{
                  boxShadow: `
                      0px 4px 4px 0px rgba(0,0,0,0.11),
                      0px 4px 4px 2px rgba(0,0,0,0.11)
                    `,
                }}
              >
                <span className="transition-all duration-700 ease-in-out group-data-[state=open]:text-lg flex-center">
                  {item.avatar}
                </span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              sideOffset={7}
              className="border border-[#E8ECEF] dark:border-[#505050] w-75"
              style={{
                boxShadow: `
                      0px 0px 24px 4px rgba(0,0,0,0.05),
                      0px 32px 48px -4px rgba(0,0,0,0.2)
                    `,
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex gap-4">
                  <div className="size-8 cursor-default rounded-full border border-[#F2F2F2] dark:border-[#505050] flex-center">
                    {item.avatar}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{item.name}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <BlockIcon
                            onClick={() =>
                              navigate(
                                Path.Settings + `?tab=agent&id=${item.id}`,
                              )
                            }
                            className="size-4 text-[#000000]/86 dark:text-[#FFFFFF] hover:text-[#00D47E] dark:hover:text-[#4ADE80]"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="cursor-default">
                          {t("agent.manage")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Label
                      onClick={() => setShowModel(!showModel)}
                      className="text-xs text-[#101213] dark:text-[#E8ECEF]"
                    >
                      {getModelInfo(item.model.name)?.display}
                      {showModel ? (
                        <ArrowDownIcon className="size-4" />
                      ) : (
                        <ArrowRightIcon className="size-4" />
                      )}
                    </Label>

                    {!showModel && (
                      <span className="text-xs text-[#000000]/85 dark:text-[#E8ECEF]/50 break-words line-clamp-3">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
                <AgentModel show={showModel} item={item} />
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      <div
        className="flex-center rounded-full backdrop-blur-lg size-8 border border-[#F2F2F2] dark:border-[#505050] hover:border-[#00D47E] dark:hover:border-[#4ADE80]"
        onClick={() => navigate(Path.Settings + "?tab=agent")}
        style={{
          boxShadow: `
                    0px 4px 4px 0px rgba(0,0,0,0.11),
                    0px 4px 4px 2px rgba(0,0,0,0.11)
                `,
        }}
      >
        <MoreIcon />
      </div>
    </div>
  );
}
