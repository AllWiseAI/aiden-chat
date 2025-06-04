"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/components/shadcn/dialog";
import { Button } from "@/app/components/shadcn/button";

interface SettingItem {
  key: string;
  value: string;
}

interface SettingInfo {
  args: string[];
  envs: SettingItem[];
}

interface McpSettingModalProps {
  open: boolean;
  settingInfo: SettingInfo;
  onConfirm: (updated: SettingInfo) => void;
  onOpenChange?: (open: boolean) => void;
}

export function McpSettingModal({
  open,
  settingInfo,
  onConfirm,
  onOpenChange,
}: McpSettingModalProps) {
  const [args, setArgs] = useState(settingInfo.args);
  const [envs, setEnvs] = useState(settingInfo.envs);
  const [envsText, setEnvsText] = useState<string>("");
  useEffect(() => {
    setArgs(settingInfo.args);
    setEnvs(settingInfo.envs);
  }, [settingInfo]);

  useEffect(() => {
    const text = envs.map((item) => `${item.key}=${item.value}`).join("\n");
    setEnvsText(text);
  }, [envs]);

  const updateArgs = (value: string) => {
    const newArgs = value.split("\n");
    setArgs(newArgs);
  };

  const updateEnvs = useCallback((envsText: string) => {
    const lines = envsText.split("\n");
    const parsed = lines
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return { key: key.trim(), value: rest.join("=").trim() };
      })
      .filter((e) => e.key !== "");
    setEnvs(parsed);
    return parsed;
  }, []);

  const handleConfirm = useCallback(() => {
    const parsedEnvs = updateEnvs(envsText);
    onConfirm({ args, envs: parsedEnvs });
    onOpenChange?.(false);
  }, [args, envs, onConfirm, onOpenChange, envsText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="dark:text-[#FEFEFE]">MCP Setting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-2 max-h-[500px] overflow-y-auto">
          {!!args.length && (
            <div>
              <h3 className="text-base mb-2 text-[#6C7275] dark:text-[#FEFEFE]">
                args
              </h3>
              <div className="mb-4">
                <textarea
                  className="w-full text-left whitespace-pre font-mono text-sm bg-background border border-input dark:border-[#6C7275] rounded-md px-3 py-2 focus:!border-primary resize-y"
                  rows={5}
                  value={args.join("\n")}
                  onChange={(e) => updateArgs(e.target.value)}
                />
              </div>
            </div>
          )}

          {!!envs.length && (
            <div>
              <h3 className="text-base mb-2 text-[#6C7275] dark:text-[#FEFEFE]">
                env
              </h3>
              <div className="flex space-x-2 mb-2">
                <textarea
                  className="w-full text-left whitespace-pre font-mono text-sm bg-background border border-input dark:border-[#6C7275] rounded-md px-3 py-2 focus:!border-primary resize-y"
                  rows={5}
                  value={envsText}
                  onChange={(e) => setEnvsText(e.target.value)}
                  placeholder="ENV=VALUE"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button
              className=" bg-white hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#6C7275] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 "
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E]"
              onClick={handleConfirm}
              type="button"
            >
              Confirm
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
