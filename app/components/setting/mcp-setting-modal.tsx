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
import { Input } from "@/app/components/shadcn/input";
import { Button } from "@/app/components/shadcn/button";

interface SettingItem {
  key: string;
  value: string;
}

interface SettingInfo {
  templates: SettingItem[];
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
  const [templates, setTemplates] = useState(settingInfo.templates);
  const [envs, setEnvs] = useState(settingInfo.envs);
  const [envsText, setEnvsText] = useState<string>("");
  useEffect(() => {
    setTemplates(settingInfo.templates);
    setEnvs(settingInfo.envs);
  }, [settingInfo]);

  useEffect(() => {
    const text = envs.map((item) => `${item.key}=${item.value}`).join("\n");
    setEnvsText(text);
  }, [envs]);

  const updateTemplate = (index: number, key: string, value: string) => {
    const newTemplates = [...templates];
    newTemplates[index] = { key, value };
    setTemplates(newTemplates);
  };

  const updateEnvs = useCallback((envsText: string) => {
    console.log("envsText===", envsText);
    const lines = envsText.split("\n");
    const parsed = lines
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return { key: key.trim(), value: rest.join("=").trim() };
      })
      .filter((e) => e.key !== "");

    console.log("parsed===", parsed);
    setEnvs(parsed);
    return parsed;
  }, []);

  const handleConfirm = useCallback(() => {
    const parsedEnvs = updateEnvs(envsText);
    onConfirm({ templates, envs: parsedEnvs });
    onOpenChange?.(false);
  }, [templates, envs, onConfirm, onOpenChange, envsText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>MCP Setting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!!templates.length && (
            <div>
              <h3 className="text-sm font-medium mb-2">Templates</h3>
              {templates.map((item, idx) => (
                <div key={idx} className="mb-4">
                  <label className="block text-sm text-muted-foreground mb-1">
                    {item.key}
                  </label>
                  <Input
                    className="!text-left w-full"
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) =>
                      updateTemplate(idx, item.key, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {!!envs.length && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Environment Variables
              </h3>
              <div className="flex space-x-2 mb-2">
                <textarea
                  className="w-full text-left whitespace-pre font-mono text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
              className=" bg-white hover:bg-[#F3F5F74D]  text-[#6C7275] border border-[#6C7275]/10 "
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
