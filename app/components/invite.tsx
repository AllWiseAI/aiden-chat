import { useRef, FormEvent } from "react";
import { Input } from "@/app/components/shadcn/input";
import { Button } from "@/app/components/shadcn/button";
import { toast } from "@/app/utils/toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { Theme } from "@/app/store";
import { useTheme } from "../hooks/use-theme";
import { apiSetInviteCode } from "../services";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import InviteLightIcon from "../icons/invite-light.svg";
import InviteDarkIcon from "../icons/invite-dark.svg";

export function InvitePage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const theme = useTheme();
  const inviteCodeRef = useRef<HTMLInputElement>(null);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inviteCodeRef.current?.value;
    if (!value) return;
    try {
      const res = (await apiSetInviteCode(inviteCodeRef.current?.value)) as {
        error: string;
      };
      if (res.error) throw new Error(res.error);
      navigate(Path.Chat);
      toast.success(t("signUp.success"));
    } catch (e: any) {
      if (e.message === "Invalid invitation code") {
        toast.error(t("signUp.invalidCode"));
      } else toast.error(e.message);
    }
  };

  return (
    <div className="w-full h-full px-6 py-13 my-10 flex flex-col gap-10 bg-white dark:bg-[#141416] mx-auto rounded-2xl">
      <div className="flex-center flex-col gap-4 text-black dark:text-white">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5 text-[#00D47E]" />
          <LogoTextIcon className="h-5.5" />
        </div>
        <span className="text-lg font-medium">{t("signUp.invite")}</span>
      </div>
      <form
        className="flex-center flex-col gap-10 w-full"
        onSubmit={handleSubmit}
      >
        {theme === Theme.Light ? (
          <InviteLightIcon className="size-30" />
        ) : (
          <InviteDarkIcon className="size-30" />
        )}

        <Input
          id="invite"
          type="text"
          ref={inviteCodeRef}
          className="w-full h-9 !text-left px-2.5 py-2 rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
          placeholder={t("signUp.enterInviteCode")}
        />
        <div className="flex flex-col gap-5 w-full">
          <Button
            type="submit"
            className="w-full h-11 !px-6 !py-3 bg-main hover:bg-[#02C174]/90 disabled:bg-[#7FD5B2] dark:disabled:bg-[#0A6E45] text-white dark:text-black font-semibold rounded-sm"
          >
            {t("general:ui.confirm")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigate(Path.Chat);
              toast.success(t("signUp.success"));
            }}
            className="w-full h-11 font-semibold rounded-sm px-6 py-4 dark:border-[#777E90]"
          >
            {t("signUp.skip")}
          </Button>
        </div>
      </form>
    </div>
  );
}
