import { useState } from "react";
import { Dialog, DialogOverlay } from "../shadcn/dialog";
import { useTranslation } from "react-i18next";
import SuccessIcon from "../../icons/success.svg";
import FailedIcon from "../../icons/close.svg";

export default function Subscription() {
  const [showPlan, setShowPlan] = useState(false);
  const { t } = useTranslation("settings");
  return (
    <>
      <div className="w-full h-full flex flex-col gap-4 justify-start items-center text-black dark:text-white">
        <div className="w-full flex flex-col gap-3 px-2.5 pt-1 pb-5">
          <div className="font-medium">{t("subscription.plan")}</div>
          <div className="flex justify-between items-center gap-5 p-2.5 bg-[#F3F5F7]/30 dark:bg-[#232627]/30 border border-[#E8ECEF] dark:border-[#232627] rounded-sm text-sm">
            <div className="text-sm flex-1">
              {t("subscription.starter.title") + t("subscription.planT")}
            </div>
            <div
              className="text-main underline hover:opacity-70 cursor-pointer"
              onClick={() => setShowPlan(true)}
            >
              {t("subscription.detail")}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogOverlay onClick={() => setShowPlan(false)} />
        {showPlan && (
          <div
            className="fixed flex gap-10 left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
            onClick={() => setShowPlan(false)}
          >
            <div
              className="relative flex flex-col gap-6 p-6 w-72 h-127 text-black bg-[#ECEFF3] rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 right-0 translate-x-[35%] -translate-y-[35%] w-100 h-100"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(0, 212, 126, 1) 0%, rgba(0, 212, 126, 0) 70%)",
                }}
              ></div>
              <div className="flex flex-col gap-3">
                <p className="text-[32px] font-light z-1">
                  {t("subscription.starter.title") + t("subscription.planT")}
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    {t("subscription.starter.price")}
                  </span>
                  <span className="text-2xl pb-2">
                    {t("subscription.month")}
                  </span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  {t("subscription.starter.content")}
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                  Current Plan
                </Button> */}
              </div>

              <div className="flex justify-between gap-4 items-center">
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F]">
                  {t("subscription.included")}
                </span>
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>{t("subscription.starter.included.1")}</span>
                </div>

                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>{t("subscription.starter.included.2")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FailedIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>{t("subscription.starter.included.3")}</span>
                </div>
              </div>
            </div>
            <div
              className="relative flex flex-col gap-6 p-6 w-72 h-127 text-white bg-[#101213] rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 right-0 translate-x-[35%] -translate-y-[35%] w-100 h-100"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(0, 212, 126, 1) 0%, rgba(0, 212, 126, 0) 70%)",
                }}
              ></div>
              <div className="flex flex-col gap-3">
                <p className="text-[32px] font-light z-1">
                  <span className="text-[#C8FF85]">
                    {t("subscription.standard.title")}
                  </span>
                  {t("subscription.planT")}
                </p>
                <div className="flex items-end gap-3 z-1">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    {t("subscription.standard.price")}
                  </span>
                  <span className="text-2xl pb-2">
                    {t("subscription.month")}
                  </span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  {t("subscription.standard.content")}
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                 Get Started
                </Button> */}
              </div>

              <div className="flex justify-between gap-4 items-center">
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F]">
                  {t("subscription.included")}
                </span>
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-4 text-sm text-[#00D47E]">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>{t("subscription.standard.included.1")}</span>
                </div>

                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>{t("subscription.standard.included.2")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 " />
                  <span>{t("subscription.standard.included.3")}</span>
                </div>
              </div>
            </div>
            <div
              className="relative flex flex-col gap-6 p-6 w-72 h-127 text-white bg-[#101213] rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 right-0 translate-x-[35%] -translate-y-[35%] w-100 h-100"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(99, 0, 212, 1) 0%, rgba(99, 0, 212, 0) 70%)",
                }}
              ></div>
              <div
                className="absolute left-0 bottom-0 -translate-x-[40%] translate-y-[40%] w-80 h-80"
                style={{
                  background:
                    "radial-gradient(circle at left bottom, rgba(99, 0, 212, 1) 0%, rgba(99, 0, 212, 0) 70%)",
                }}
              ></div>
              <div className="flex flex-col gap-3">
                <p className="text-[32px] font-light">
                  <span className="text-[#C89CFF]">
                    {t("subscription.pro.title")}
                  </span>
                  {t("subscription.planT")}
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    {t("subscription.pro.price")}
                  </span>
                  <span className="text-2xl pb-2">
                    {t("subscription.month")}
                  </span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  {t("subscription.pro.content")}
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                  Current Plan
                </Button> */}
              </div>

              <div className="flex justify-between gap-4 items-center">
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F]">
                  {t("subscription.included")}
                </span>
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-4 text-sm text-[#C8B1FF]">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span> {t("subscription.pro.included.1")}</span>
                </div>

                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>{t("subscription.pro.included.2")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>{t("subscription.pro.included.3")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
