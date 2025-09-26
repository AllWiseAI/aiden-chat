import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Label } from "../components/shadcn/label";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./shadcn/hover-card";
import { useAppConfig } from "../store";
import { useAgentStore } from "../store";
import { Path } from "../constant";
import { INNER_PROVIDER_NAME } from "@/app/constant";
import { ProviderIcon } from "./setting/provider-icon";
import { ModelOption, ProviderOption } from "@/app/typing";
import AccessIcon from "../icons/access.svg";
import RightIcon from "../icons/right-arrow.svg";
import ArrowDownIcon from "../icons/arrow-down.svg";
import ArrowRightIcon from "@/app/icons/arrow-right.svg";
import MoreIcon from "../icons/more.svg";
import BlockIcon from "../icons/block.svg";
import clsx from "clsx";

function AgentModel({ show }: { show: boolean }) {
  const navigate = useNavigate();
  const modelList = useAppConfig((s) => s.models);
  const localProviders = useAppConfig((state) => state.localProviders);
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

  return (
    <div>
      {show && (
        <div className="max-w-60 mx-auto border light:border-[#E8ECEF] rounded-sm">
          <div className="w-full bg-[#FEFEFE] dark:bg-[#141718] overflow-y-auto max-h-[260px] px-1 py-2 space-y-1.5">
            {Object.entries(groupedLocalProviders).map(
              ([groupLabel, provider]) => {
                const isOpen = openGroup === groupLabel;
                const models: ModelOption[] = provider.models;
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
                        >
                          <div
                            className="text-sm text-[#141718] dark:text-[#FEFEFE] font-normal truncate max-w-[170px]"
                            title={model.label}
                          >
                            {model.label}
                          </div>
                          <AccessIcon className="size-4 text-main" />
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
                Manage
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
  const agentArr = useAgentStore((state) => state.agents);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);

  return (
    <div className="flex items-center group">
      {agentArr.map((item) => (
        <HoverCard
          key={item.id}
          open={hoverId === item.id}
          onOpenChange={(open) => setHoverId(open ? item.id : null)}
        >
          <HoverCardTrigger asChild>
            <div
              className={clsx(
                "cursor-default flex-center rounded-full backdrop-blur-lg border hover:border-[#00D47E] dark:hover:border-[#4ADE80] hover:size-10 transition-all delay-100 -mr-2.5 group-hover:mr-2",
                hoverId === item.id
                  ? "border-[#00D47E] dark:border-[#4ADE80] size-10"
                  : "border-[#F2F2F2] dark:border-[#505050] size-8",
              )}
              style={{
                boxShadow: `
                      0px 4px 4px 0px rgba(0,0,0,0.11),
                      0px 4px 4px 2px rgba(0,0,0,0.11)
                    `,
              }}
            >
              {item.avatar}
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
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <BlockIcon
                      onClick={() =>
                        navigate(Path.Settings + `?tab=agent&id=${item.id}`)
                      }
                      className="size-4 text-[#000000]/86 dark:text-[#FFFFFF] hover:text-[#00D47E] dark:hover:text-[#4ADE80]"
                    />
                  </div>
                  <Label
                    onClick={() => setShowModel(!showModel)}
                    className="text-xs text-[#101213] dark:text-[#E8ECEF]"
                  >
                    {item.model}
                    {showModel ? (
                      <ArrowDownIcon className="size-4" />
                    ) : (
                      <ArrowRightIcon className="size-4" />
                    )}
                  </Label>

                  {!showModel && (
                    <span className="text-xs text-[#000000]/85 dark:text-[#E8ECEF]/50 line-clamp-3">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
              <AgentModel show={showModel} />
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
