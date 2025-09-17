import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../shadcn/dialog";
import { Button } from "../shadcn/button";
import { Password } from "../password";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/app/utils/toast";
import { apiChangePassword } from "../../services";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import { Path } from "../../constant";
import clsx from "clsx";
import LoadingIcon from "../../icons/loading-spinner.svg";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuccessModal({ open, onOpenChange }: SuccessModalProps) {
  const { t } = useTranslation("settings");
  const setDefaultState = useAuthStore((state) => state.setDefaultState);
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-95 rounded-sm gap-5 p-5"
        closeIcon={false}
      >
        <DialogHeader>
          <DialogTitle className="font-medium text-lg text-center dark:text-[#FEFEFE]">
            {t("general.password.success.title")}
          </DialogTitle>
        </DialogHeader>
        <span className="text-center text-sm">
          {t("general.password.success.content")}
        </span>
        <DialogFooter>
          <Button
            className="bg-main w-34 h-9 font-medium rounded-sm border border-[#6C7275]/10 px-2.5 py-2 mx-auto"
            onClick={() => {
              setDefaultState();
              navigate(Path.Login);
            }}
            type="button"
          >
            {t("general.password.success.btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChangePasswordModal({
  open,
  onOpenChange,
  onSuccess,
}: ChangePasswordModalProps) {
  const { t } = useTranslation("settings");
  const [oldVal, setOldVal] = useState("");
  const [newVal, setNewVal] = useState("");
  const [confirmVal, setConfirmVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    if (newVal !== confirmVal) {
      setError(t("auth:inValidPassword"));
      setLoading(false);
      return;
    }
    try {
      const res = (await apiChangePassword({
        oldVal,
        newVal,
        confirmVal,
      })) as any;

      if ("error" in res) {
        throw res;
      }

      onSuccess();
    } catch (e: any) {
      toast.error(e.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-95 rounded-sm gap-5 p-5"
        closeIcon={false}
      >
        <DialogHeader>
          <DialogTitle className="font-medium text-lg text-center dark:text-[#FEFEFE]">
            {t("general.password.change")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <label className="w-max text-sm text-[#6C7275] dark:text-[#E8ECEF]">
              {t("general.password.old.title")}
            </label>
            <Password
              value={oldVal}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, "");
                setOldVal(value);
              }}
              className="!text-left rounded-sm"
              placeholder={t("general.password.old.tip")}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="w-max text-sm text-[#6C7275] dark:text-[#E8ECEF]">
              {t("general.password.new.title")}
            </label>
            <Password
              value={newVal}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, "");
                setNewVal(value);
                if (error && value === confirmVal) {
                  setError("");
                }
              }}
              className={clsx(
                "!text-left rounded-sm",
                error && "border-[#EF466F]",
              )}
              placeholder={t("general.password.new.tip")}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="w-max text-sm text-[#6C7275] dark:text-[#E8ECEF]">
              {t("general.password.reEnter.title")}
            </label>
            <Password
              value={confirmVal}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, "");
                setConfirmVal(value);
                if (error && newVal === value) {
                  setError("");
                }
              }}
              className={clsx(
                "!text-left rounded-sm",
                error && "border-[#EF466F]",
              )}
              placeholder={t("general.password.reEnter.tip")}
            />
          </div>
        </div>
        {error && (
          <span className="text-[#EF466F] text-sm font-light">{error}</span>
        )}
        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button
              className="bg-white h-8 rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2"
              type="button"
            >
              {t("general:dialog.cancel")}
            </Button>
          </DialogClose>
          <Button
            disabled={!(oldVal && newVal && confirmVal && !loading)}
            className="flex-1 h-8 rounded-sm bg-main text-white dark:text-black px-2.5 py-2 flex items-center gap-2"
            onClick={handleSubmit}
            type="submit"
          >
            {loading && <LoadingIcon className="size-4 animate-spin" />}
            {t("general:dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
