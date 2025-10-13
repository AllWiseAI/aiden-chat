import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/app/store";
import { Dialog, DialogOverlay } from "../shadcn/dialog";
import { useTranslation } from "react-i18next";
import { Plan } from "../../typing";

export default function Subscription() {
  const [showPlan, setShowPlan] = useState(false);
  const [userPlan, setUserPlan] = useAuthStore((state) => [
    state.userPlan,
    state.setUserPlan,
  ]);
  const { t } = useTranslation("settings");
  const [plan] = useState<Plan>(userPlan);

  useEffect(() => {
    setUserPlan();
  }, [setUserPlan]);

  const displayPlan = useMemo(() => {
    return t(`subscription.${plan}.title`) + t("subscription.planT");
  }, [plan]);

  return (
    <>
      <div className="w-full h-full flex flex-col gap-4 justify-start items-center text-black dark:text-white min-w-60">
        <div className="w-full flex flex-col gap-3 px-2.5 pt-1 pb-5">
          <div className="font-medium">{t("subscription.plan")}</div>
          <div className="flex justify-between items-center gap-5 p-2.5 bg-[#F3F5F7]/30 dark:bg-[#232627]/30 border border-[#E8ECEF] dark:border-[#232627] rounded-sm text-sm">
            <div className="text-sm flex-1">{displayPlan}</div>
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
              className="relative flex flex-col gap-4 p-6 w-77 h-146 overflow-y-auto overflow-hidden text-black bg-[#ECEFF3] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 right-0 translate-x-[35%] -translate-y-[35%] w-100 h-100"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(0, 212, 126, 1) 0%, rgba(0, 212, 126, 0) 70%)",
                }}
              ></div>
              <div className="flex flex-col gap-1">
                <p className="text-[32px] font-light z-1">
                  {t("subscription.free.title") + t("subscription.planT")}
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    {t("subscription.free.price")}
                  </span>
                  <span className="text-2xl pb-2">
                    {t("subscription.month")}
                  </span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  {t("subscription.free.content")}
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                  Current Plan
                </Button> */}
              </div>

              <div className="flex justify-between gap-4 items-center">
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F] font-normal">
                  {t("subscription.included")}
                </span>
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature1")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.free.feature1Text")}
                  </span>
                </div>

                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature2")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.free.feature2Text")}
                  </span>
                </div>
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature3")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-normal">
                      {t("subscription.free.feature3Text.1")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.free.feature3Text.2")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.free.feature3Text.3")}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature4")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.free.feature4Text")}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="relative flex flex-col gap-4 p-6 w-77 h-146 overflow-y-auto overflow-hidden text-white bg-[#101213] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 right-0 translate-x-[35%] -translate-y-[35%] w-100 h-100"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(0, 212, 126, 1) 0%, rgba(0, 212, 126, 0) 70%)",
                }}
              ></div>
              <div className="flex flex-col gap-1">
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
                <span className="text-lg text-[#6F6F6F] font-normal">
                  {t("subscription.included")}
                </span>
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-3 text-sm text-[#FEFEFE]/80">
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature1")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.standard.feature1Text")}
                  </span>
                </div>

                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature2")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.standard.feature2Text")}
                  </span>
                  <span className="text-[#C7FF85] font-semibold">
                    {t("subscription.standard.feature2Amount")}
                  </span>
                </div>
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature3")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-normal">
                      {t("subscription.standard.feature3Text.1")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.standard.feature3Text.2")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.standard.feature3Text.3")}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature4")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.standard.feature4Text")}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="relative flex flex-col gap-4 p-6 w-77 h-146 text-white bg-[#101213] rounded-xl overflow-hidden"
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
              <div className="flex flex-col gap-1">
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
                <span className="text-lg text-[#6F6F6F] font-normal">
                  {t("subscription.included")}
                </span>
                <div className="flex-1 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-[#FEFEFE]/80">
                <div>
                  <span className="text-[#744ADE] mr-1">
                    {t("subscription.feature1")}
                  </span>
                  <span>{t("subscription.pro.feature1Text")}</span>
                </div>

                <div>
                  <span className="text-[#744ADE] font-semibold mr-1">
                    {t("subscription.feature2")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.pro.feature2Text")}
                  </span>
                  <span className="font-semibold text-[#FF5DE1]">
                    {t("subscription.pro.feature2Amount")}
                  </span>
                </div>
                <div>
                  <span className="text-[#744ADE] font-semibold mr-1">
                    {t("subscription.feature3")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-normal">
                      {t("subscription.pro.feature3Text.1")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.pro.feature3Text.2")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.pro.feature3Text.3")}
                    </span>
                    <span className="font-normal">
                      {t("subscription.pro.feature3Text.4")}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-primary font-semibold mr-1">
                    {t("subscription.feature4")}
                  </span>
                  <span className="font-normal">
                    {t("subscription.standard.feature4Text")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
