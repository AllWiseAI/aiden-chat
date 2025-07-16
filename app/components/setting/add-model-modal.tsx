"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/components/shadcn/dialog";
import { Button } from "@/app/components/shadcn/button";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import { Label } from "@/app/components/shadcn/label";
import { Input } from "@/app/components/shadcn/input";
import { Password } from "@/app/components/password";
import { ProviderSelect } from "./provider-select";
import clsx from "clsx";

interface ModelInfo {
  provider: string;
  apiKey: string;
  model: string;
}

interface AddModelModalProps {
  open: boolean;
  isEdit: boolean;
  modelInfo?: ModelInfo;
  onConfirm: (updated: ModelInfo) => void;
  onOpenChange?: (open: boolean) => void;
}

export function AddModelModal({
  open,
  isEdit,
  onConfirm,
  onOpenChange,
}: AddModelModalProps) {
  const { t: tInner } = useTranslation("settings");

  const handleConfirm = useCallback(() => {
    const updated: ModelInfo = {};
    onConfirm(updated);
    onOpenChange?.(false);
  }, []);

  const [formData, setFormData] = useState({
    provider: "openai",
    apiKey: "",
    model: "",
    customUrl: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    console.log("id", id, value);
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleProviderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      ["provider"]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!w-[380px] rounded-sm gap-5 p-5"
        closeIcon={false}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg text-center dark:text-[#FEFEFE]">
            {isEdit
              ? tInner("model.editModelTitle")
              : tInner("model.addModelTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="flex gap-2 w-full">
            <Label
              htmlFor="provider"
              className="font-normal !gap-1 text-sm min-w-14"
            >
              {tInner("model.provider")}
            </Label>

            <ProviderSelect
              value={formData.provider}
              onChange={handleProviderChange}
            />
          </div>

          <div className="flex gap-2 w-full">
            <Label
              htmlFor="apiKey"
              className="font-normal !gap-1 text-sm min-w-14"
            >
              {tInner("model.apiKey")}
            </Label>
            <Password
              id="apiKey"
              type="apiKey"
              placeholder={t("Enter API Key")}
              className="!w-full h-9 !text-left !px-2.5 !py-2 !rounded-sm text-sm border hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
              value={formData.apiKey}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex gap-2 w-full">
            <Label
              htmlFor="model"
              className="font-normal text-sm !min-w-[56px]"
            >
              {tInner("model.model")}
            </Label>
            <Input
              id="model"
              type="email"
              className={clsx(
                "w-full h-9 !text-left px-2.5 py-2 rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
                {
                  "border border-[#EF466F]": false,
                },
              )}
              value={formData.model}
              onChange={handleChange}
              clearable
            />
            {false && (
              <span className="text-[10px] text-red-500">label error</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button
              className="bg-white h-8 rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2"
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              {t("dialog.cancel")}
            </Button>
          </DialogClose>
          <DialogClose asChild className="flex-1">
            <Button
              className="h-8 rounded-sm bg-[#00D47E] text-white dark:text-black px-2.5 py-2"
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
