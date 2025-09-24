import { useNavigate } from "react-router-dom";
import emojis from "emojilib";
import { useState } from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./shadcn/hover-card";
import { Path } from "../constant";
import MoreIcon from "../icons/more.svg";
import BlockIcon from "../icons/block.svg";
import clsx from "clsx";

export default function Agenttab() {
  const navigate = useNavigate();
  console.log(1111, emojis);
  const agentArr = [
    {
      id: "1",
      name: "Multimodal Agent",
      avatar: "",
      source: "default",
      description:
        "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
      prompt: "",
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
                "flex-center rounded-full backdrop-blur-lg border hover:border-[#00D47E] dark:hover:border-[#4ADE80] hover:size-10 transition-all delay-100 -mr-2.5 group-hover:mr-2",
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
            ></div>
          </HoverCardTrigger>
          <HoverCardContent
            sideOffset={7}
            className="border border-[#E8ECEF] w-75"
            style={{
              boxShadow: `
                      0px 0px 24px 4px rgba(0,0,0,0.05),
                      0px 32px 48px -4px rgba(0,0,0,0.2)
                    `,
            }}
          >
            <div className="flex gap-4">
              <div className="size-8 rounded-full border border-[#F2F2F2]"></div>
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
                <span className="text-xs text-[#000000]/85 line-clamp-3">
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
