import { useState } from "react";
import clsx from "clsx";
import emojiData from "unicode-emoji-json";
import { Emoji } from "../typing";

type EmojiGroupName = (typeof emojiStrArr)[number];
type EmojiGroupMap = Record<EmojiGroupName, Emoji[]>;
interface EmojiListProps {
  value?: Emoji;
  onChange?: (emoji: Emoji) => void;
  className?: string;
}

function buildGroupedEmojis(): EmojiGroupMap {
  const grouped: EmojiGroupMap = {};

  for (const [char, info] of Object.entries(emojiData)) {
    if (!grouped[info.group]) {
      grouped[info.group] = [];
    }
    grouped[info.group].push(char);
  }

  return grouped;
}

const emojiGroups = buildGroupedEmojis();
const emojiStrArr = [
  "Smileys & Emotion",
  "People & Body",
  "Animals & Nature",
  "Food & Drink",
  "Travel & Places",
  "Activities",
  "Symbols",
  "Objects",
  "Flags",
];

export function EmojiList({ value, onChange, className }: EmojiListProps) {
  console.log(emojiGroups);
  const [selectedGroup, setSelectedGroup] = useState("Smileys & Emotion");
  const handleSelectEmoji = (emoji: Emoji) => {
    // 将点击事件传给外部组件（父组件通过 setState 接收）
    onChange?.(emoji);
  };

  return (
    <div className={clsx("flex flex-col w-max", className)}>
      <div className="shrink-0 flex justify-around items-center border-b border-[#E8ECEF] dark:border-[#343839] overflow-hidden">
        {emojiStrArr.map((item) => (
          <div key={item} className="flex flex-col">
            <div
              onClick={() => setSelectedGroup(item)}
              className="relative flex-center size-9 cursor-pointer hover:bg-[#F3F5F7] dark:hover:bg-black"
            >
              {emojiGroups[item][0]}
              <div
                className={clsx("absolute z-1 bottom-0 w-[130%] h-[2px]", {
                  "bg-main": item === selectedGroup,
                })}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-8 scroll-container place-items-center">
        {emojiGroups[selectedGroup].map((emoji) => (
          <div
            key={emoji}
            onClick={() => handleSelectEmoji(emoji)}
            className={clsx(
              "flex-center size-9 hover:bg-[#F3F5F7] dark:hover:bg-black cursor-pointer rounded-sm",
              {
                "bg-[#F3F5F7] dark:bg-black": value === emoji,
              },
            )}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
