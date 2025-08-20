"use client";

import { useState, useRef, Dispatch, SetStateAction, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./shadcn/popover";
import { Input } from "./shadcn/input";
import { useTranslation } from "react-i18next";
import TimeCalendarIcon from "../icons/time-calendar.svg";
import clsx from "clsx";

interface TimeSelectProps {
  hour: number | null;
  minute: number | null;
  timeErr: string;
  setTimeErr: Dispatch<SetStateAction<string>>;
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

function verifyTime(time: string): boolean {
  const [h, m] = time.split(":").map((item: string) => Number(item));
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  if (h < 0 || h > 23) return false;
  if (m < 0 || m > 60) return false;
  return true;
}

const TIME_OPTIONS = generateTimeOptions();

export default function TimeSelect({
  hour,
  minute,
  timeErr,
  setTimeErr,
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

  useEffect(() => {
    if (hour != null && minute != null) {
      setInputVal(`${formatHour}:${formatMinute}`);
    }
  }, [hour, minute]);

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
        <div
          className={clsx(
            "flex items-center gap-1.5 rounded-sm pl-1.5",
            timeErr && "border border-[#EF466F] dark:border-[#EF466F]",
          )}
        >
          <TimeCalendarIcon className="text-main" />
          <Input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => {
              const val = e.target.value;
              setInputVal(val);
              onChange(e.target.value);
              if (!verifyTime(val)) {
                setTimeErr(t("task.invalidTime"));
              } else setTimeErr("");
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t("task.time")}
            className="w-full h-10 !text-left border-0 pl-0"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className={clsx(
          "p-0 w-[var(--radix-popover-trigger-width)] max-h-60 overflow-auto",
          !filtered.length && "hidden",
        )}
      >
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
