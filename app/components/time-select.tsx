"use client";

import { useState, useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./shadcn/popover";
import { Input } from "./shadcn/input";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

interface TimeSelectProps {
  hour: number | null;
  minute: number | null;
  onChange: (val: string) => void;
}

function generateTimeOptions(stepMinutes: number = 15): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const hour = h.toString().padStart(2, "0");
      const min = m.toString().padStart(2, "0");
      times.push(`${hour}:${min}`);
    }
  }
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

export default function TimeSelect({
  hour,
  minute,
  onChange,
}: TimeSelectProps) {
  const { t } = useTranslation("general");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formatHour = hour !== null && hour < 10 ? `0${hour}` : hour;
  const formatMinute = minute !== null && minute < 10 ? `0${minute}` : minute;

  const [inputVal, setInputVal] = useState(
    hour != null && minute != null ? `${formatHour}:${formatMinute}` : "",
  );

  const filtered = TIME_OPTIONS.filter((t) => t.includes(inputVal.trim()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onClick={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div>
          <Input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => {
              const val = e.target.value;
              setInputVal(val);
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t("task.time")}
            className={clsx("w-full h-10 !text-left border-0")}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-60 overflow-auto">
        {filtered.map((time) => (
          <div
            className="hover:bg-[#F5F5F5] dark:hover:bg-[#101213] px-2.5 py-2 cursor-default"
            key={time}
            onClick={() => {
              setInputVal(time);
              onChange(time);
              setOpen(false);
            }}
          >
            {time}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
