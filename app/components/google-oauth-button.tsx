import { Button } from "@/app/components/shadcn/button";
import { Divider } from "../components/divider";
import GoogleLoginIcon from "@/app/icons/google-login.svg";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

export function GoogleAuthButton({
  type = "signin",
}: {
  type: "signin" | "signup";
}) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const handleGoogleLogin = () => {
    navigate(Path.GoogleOAuth);
  };

  return (
    <>
      <Divider label={t("signIn.or")} />
      <Button
        className="w-full h-11 !px-2.5 !py-2 border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]"
        variant="outline"
        onClick={handleGoogleLogin}
      >
        <GoogleLoginIcon className="size-6" />
        {type === "signin" ? t("signIn.googleLogin") : t("signUp.googleLogin")}
      </Button>
    </>
  );
}
