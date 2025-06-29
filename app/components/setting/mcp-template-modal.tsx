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
import { TTemplateInfo } from "@/app/typing";
import { t } from "i18next";

interface McpTemplateModalProps {
  open: boolean;
  templateInfo: TTemplateInfo;
  onConfirm: (updated: TTemplateInfo) => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function McpTemplateModal({
  open,
  templateInfo,
  onConfirm,
  onOpenChange,
}: McpTemplateModalProps) {
  const [templates, setTemplates] = useState(templateInfo.templates);
  const [envs, setEnvs] = useState(templateInfo.envs);
  const [multiArgs, setMultiArgs] = useState(templateInfo.multiArgs);
  const [envsText, setEnvsText] = useState<string>("");

  useEffect(() => {
    const text = envs.map((item) => `${item.key}=${item.value}`).join("\n");
    setEnvsText(text);
  }, [envs]);

  const updateTemplate = (index: number, value: string) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], value };
    setTemplates(newTemplates);
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

  const updateMultiArgs = (index: number, value: string) => {
    const newMultiArgs = [...multiArgs];
    newMultiArgs[index] = { ...newMultiArgs[index], value: value.split("\n") };
    setMultiArgs(newMultiArgs);
  };

  const handleConfirm = useCallback(() => {
    const parsedEnvs = updateEnvs(envsText);
    onConfirm({ templates, envs: parsedEnvs, multiArgs });
    onOpenChange?.(false);
  }, [templates, onConfirm, onOpenChange, envsText, multiArgs, updateEnvs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-80 rounded-sm gap-5 p-5"
        closeIcon={false}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center dark:text-[#FEFEFE]">
            {t("dialog.mcpSetting")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {!!templates?.length && (
            <div>
              {templates.map((template, index) => {
                return (
                  <div key={index}>
                    <div className="text-sm mb-2 text-[#6C7275] dark:text-[#FEFEFE]">
                      {template.key}
                    </div>
                    <textarea
                      className="w-full text-left whitespace-pre font-mono text-smdark:border-[#6C7275] bg-background border border-input rounded-sm px-2.5 py-2 focus:!border-primary resize-none"
                      rows={5}
                      value={template.value}
                      onChange={(e) => updateTemplate(index, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {!!multiArgs?.length && (
            <div>
              {multiArgs?.map((arg, index) => {
                return (
                  <div className="flex flex-col space-x-2 mb-2" key={index}>
                    <div className="mb-2 text-[#6C7275] dark:text-[#FEFEFE]">
                      {arg.key}
                    </div>
                    <textarea
                      className="w-full text-left whitespace-pre font-mono text-sm dark:border-[#6C7275] bg-background border border-input rounded-sm px-2.5 py-2 focus:!border-primary resize-y"
                      rows={5}
                      value={arg.value.join("\n")}
                      onChange={(e) => updateMultiArgs(index, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {!!envs.length && (
            <div className="space-y-4">
              {envs.map((item, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-[#6C7275] dark:text-white mb-2.5">
                    {item.key}
                  </label>
                  <input
                    className="w-full h-[34px] !text-left font-mono text-sm dark:border-[#6C7275] bg-background border border-input rounded-sm px-2.5 py-2 focus:border-primary focus:outline-none"
                    value={item.value}
                    onChange={(e) => {
                      const newEnvs = [...envs];
                      newEnvs[idx].value = e.target.value;
                      setEnvs(newEnvs);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button
              className="bg-white h-8 rounded-sm text-xs hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2"
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              {t("dialog.cancel")}
            </Button>
          </DialogClose>
          <DialogClose asChild className="flex-1">
            <Button
              className="h-8 rounded-sm text-xs bg-[#00D47E] text-white dark:text-black px-2.5 py-2"
              onClick={handleConfirm}
              type="button"
            >
              {t("dialog.save")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
