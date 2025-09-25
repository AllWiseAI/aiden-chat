import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./shadcn/hover-card";
import { useAgentStore } from "../store";
import { Path } from "../constant";
import MoreIcon from "../icons/more.svg";
import BlockIcon from "../icons/block.svg";
import clsx from "clsx";

export default function Agenttab() {
  const navigate = useNavigate();
  const agentArr = useAgentStore((state) => state.agents);
  const [hoverId, setHoverId] = useState<string | null>(null);
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
                <span className="text-xs text-[#000000]/85 dark:text-[#E8ECEF]/50 line-clamp-3">
                  {item.description}
                </span>
              </div>
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
