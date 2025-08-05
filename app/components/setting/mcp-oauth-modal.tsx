"use client";

import { useCallback, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/components/shadcn/dialog";
import clsx from "clsx";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/shadcn/select";
import { Password } from "@/app/components/password";
import { Input } from "@/app/components/shadcn/input";

import { Label } from "@/app/components/shadcn/label";

import { Button } from "@/app/components/shadcn/button";
import { t } from "i18next";
import { useTranslation } from "react-i18next";

import {
  addOAuthCredential,
  revokeCredential,
  addPasswordCredential,
} from "@/app/services/oauth";
import { useAppConfig } from "@/app/store";
import EmailIcon from "@/app/icons/email.svg";
import DeleteIcon from "@/app/icons/delete.svg";
import AddIcon from "@/app/icons/add.svg";
import AddOutlineIcon from "@/app/icons/add-outline.svg";
import { AccountItem, McpItemInfo } from "@/app/typing";
import DeleteDialog from "@/app/components/delete-dialog";
import { toast } from "sonner";

interface McpOauthModalProps {
  mcpInfo: McpItemInfo;
  open: boolean;
  onConfirm: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function McpOauthModal({
  mcpInfo,
  open,
  onConfirm,
  onOpenChange,
}: McpOauthModalProps) {
  if (mcpInfo.mcp_key === "aiden-outlook") {
    console.log(mcpInfo);
  }
  const { t: tInner } = useTranslation("settings");

  const oauthAccounts = useAppConfig((state) => state.oauthAccounts);
  const updateOauthAccount = useAppConfig((state) => state.updateOauthAccount);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<AccountItem>();
  const [isShowAdd, setIsShowAdd] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [pwd, setPwd] = useState<string>("");

  const handleDeleteAccount = (item: AccountItem) => {
    setCurrentAccount(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (currentAccount) {
      resolveDeleteAccount(currentAccount);
    }
    setIsDeleteOpen(false);
  };

  const resolveDeleteAccount = async (item: AccountItem) => {
    const { mcp_key } = mcpInfo;
    try {
      const res = await revokeCredential({
        server_name: mcp_key,
        service: item.service,
        account: item.account,
      });

      if (res?.message === "Credential revoked") {
        updateOauthAccount(
          oauthAccounts.filter((i) => i.account !== item.account),
        );
        toast.success(tInner("mcp.delete.success"));
      } else {
        toast.error(tInner("mcp.delete.fail"));
      }
    } catch {
      toast.error(tInner("mcp.delete.fail"));
    }
  };

  const handleConfirm = useCallback(async () => {
    const { aiden_credential, mcp_key } = mcpInfo;
    if (isShowAdd && aiden_credential && aiden_credential.type === "password") {
      try {
        const res = await addPasswordCredential({
          server_name: mcp_key,
          service: provider,
          account: account,
          password: pwd,
        });
        if (res?.message === "Credential added completed") {
          const merged = [
            ...oauthAccounts,
            ...[{ service: provider, account: account }],
          ];
          updateOauthAccount(merged);
          setIsShowAdd(false);
          setProvider("");
          setAccount("");
          setPwd("");
          toast.success(tInner("mcp.add.success"));
        } else {
          toast.error(tInner("mcp.add.fail"));
        }
      } catch {
        toast.error(tInner("mcp.add.fail"));
      }
    } else {
      onConfirm();
      onOpenChange?.(false);
    }
  }, [onConfirm, onOpenChange, mcpInfo, account, pwd, provider]);

  const handleAddAcount = useCallback(async () => {
    const { aiden_credential } = mcpInfo;
    if (aiden_credential && aiden_credential.type === "oauth") {
      try {
        const res = await addOAuthCredential(mcpInfo.mcp_key);

        if (res?.message === "Credential added completed") {
          const merged = [...oauthAccounts, ...res.data.accounts];
          const unique = Array.from(
            new Map(merged.map((item) => [item.account, item])).values(),
          );
          updateOauthAccount(unique);
          toast.success(tInner("mcp.add.success"));
        } else {
          toast.error(tInner("mcp.add.fail"));
        }
      } catch (err: any) {
        if (err?.status === 400) {
          toast.error(tInner("mcp.add.fail"));
        } else {
          toast.error(tInner("mcp.add.fail"));
        }
      }
    } else {
      setIsShowAdd(true);
    }
  }, []);

  const handleProviderChange = (value: string) => {
    setProvider(value);
  };
  const handleAccountChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setAccount(value);
  };
  const handlePwdChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPwd(value);
  };

  const providerList = useMemo(() => {
    return mcpInfo.aiden_credential?.providers || [];
  }, [mcpInfo]);

  const addBtnDisabled = useMemo(() => {
    return isShowAdd && (!pwd || !account || !provider);
  }, [isShowAdd, pwd, account, provider]);

  const renderAddContent = () => {
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-1 w-full">
          <Label
            htmlFor="provider"
            className="font-normal !gap-1 text-sm min-w-14"
          >
            {tInner("mcp.provider")}
          </Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger className={`w-full`}>
              <SelectValue placeholder={tInner("mcp.providerTip")} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectGroup>
                {providerList.map((provider) => (
                  <SelectItem
                    key={provider}
                    value={provider}
                    className="w-full! !h-9"
                  >
                    <div className="flex items-center gap-2">
                      <span>{provider}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <Label
            htmlFor="account"
            className="font-normal !gap-1 text-sm min-w-14"
          >
            {tInner("mcp.account")}
          </Label>
          <Input
            id="account"
            type="email"
            placeholder={tInner("mcp.accountTip")}
            className={clsx(
              "w-full h-9 !text-left px-2.5 py-2 rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
              {
                "border border-[#EF466F]": false,
              },
            )}
            value={account}
            onChange={handleAccountChange}
            clearable
            required
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <Label htmlFor="pwd" className="font-normal !gap-1 text-sm min-w-14">
            {tInner("mcp.pwd")}
          </Label>
          <div className="flex-1 w-full">
            <Password
              id="pwd"
              type="password"
              placeholder={tInner("mcp.pwdTip")}
              className={clsx(
                "!w-full h-9 !text-left !px-2.5 !py-2 !rounded-sm text-sm border",
              )}
              value={pwd}
              onChange={handlePwdChange}
              required
            />
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    return (
      <>
        {oauthAccounts.map((item) => (
          <div
            key={item.account}
            className="flex justify-between items-center  border border-[#E8ECEF] dark:border-[#232627] rounded-sm px-2.5 py-2"
          >
            <div className="flex gap-2 items-center text-xs">
              <EmailIcon size={5} />
              <span>{item.account}</span>
            </div>
            <Button
              variant="ghost"
              className="size-6 text-[#EF466F]"
              onClick={() => handleDeleteAccount(item)}
            >
              <DeleteIcon className="size-4" />
            </Button>
          </div>
        ))}
        {oauthAccounts.length ? (
          <Button
            variant="ghost"
            className="h-9 text-main flex justify-start items-center gap-1 !px-1.5 py-1.5 rounded-sm"
            onClick={handleAddAcount}
          >
            <AddIcon className="size-5 text-main" />
            <span className="text-main font-medium select-none">
              {tInner("mcp.addAccount")}
            </span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="h-9 text-sm w-full text-center border border-[#E8ECEF] dark:border-[#232627] bg-transparent hover:bg-transparent text-main flex justify-center items-center gap-1 !px-1.5 py-1.5 rounded-sm"
            onClick={handleAddAcount}
          >
            <AddOutlineIcon className="size-5" />
            <span className="text-main font-medium select-none">
              {tInner("mcp.addAccountTips")}
            </span>
          </Button>
        )}
      </>
    );
  };

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
          <DialogTitle className="text-lg text-center dark:text-[#FEFEFE]">
            {t("dialog.outlookAccount")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {isShowAdd ? renderAddContent() : renderContent()}
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
          <Button
            className="flex-1 h-8 rounded-sm bg-[#00D47E] text-white dark:text-black px-2.5 py-2"
            onClick={handleConfirm}
            disabled={addBtnDisabled}
            type="button"
          >
            {t("dialog.confirm")}
          </Button>
          <DeleteDialog
            title={tInner("mcp.delete.title")}
            description={tInner("mcp.delete.description")}
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteOpen(false)}
            isOpen={isDeleteOpen}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
