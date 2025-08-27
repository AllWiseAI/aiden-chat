"use client";

import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
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
  if (m < 0 || m > 59) return false;
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

  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    if (hour != null && minute != null) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      setInputVal(`${h}:${m}`);
    }
  }, [hour, minute]);

  const matchedRef = useRef<HTMLDivElement | null>(null);
  const matchedOption = TIME_OPTIONS.find((time) =>
    time.startsWith(inputVal.trim()),
  );
  useEffect(() => {
    if (open && matchedRef.current) {
      matchedRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [matchedOption, open]);

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
            "flex items-center gap-1.5 rounded-sm pl-1.5 w-full border border-white dark:border-[#101213] hover:border-[#232627]/50 dark:hover:border-white hover:focus-within:border-[#00AB66] dark:hover:focus-within:border-[#00D47E] focus-within:border-[#00AB66] dark:focus-within:border-[#00D47E]",
            timeErr && "!border-[#EF466F] !dark:border-[#EF466F]",
          )}
        >
          <TimeCalendarIcon className="text-main shrink-0" />
          <Input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => {
              const val = e.target.value;
              setInputVal(val);
              if (!verifyTime(val)) {
                setTimeErr(t("task.invalidTime"));
              } else setTimeErr("");
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => onChange(inputVal)}
            placeholder={t("task.time")}
            className="flex-1 h-[38px] !text-left border-0 pl-0 bg-transparent dark:bg-transparent"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className={clsx(
          "p-0 w-[var(--radix-popover-trigger-width)] max-h-60 overflow-auto",
        )}
      >
        {TIME_OPTIONS.map((time) => {
          const isMatched = time === matchedOption;
          return (
            <div
              ref={isMatched ? matchedRef : null}
              className={clsx(
                "hover:bg-[#F5F5F5] dark:hover:bg-[#101213] px-2.5 py-2 cursor-default",
                time === inputVal &&
                  "bg-[#F5F5F5] dark:bg-[#101213] hover:bg-[#101213]",
              )}
              key={time}
              onClick={() => {
                setInputVal(time);
                setTimeErr("");
                onChange(time);
                setOpen(false);
              }}
            >
              {time}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
