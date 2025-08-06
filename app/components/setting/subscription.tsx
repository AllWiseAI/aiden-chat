import { useState } from "react";
import { Dialog, DialogOverlay } from "../shadcn/dialog";
import SuccessIcon from "../../icons/success.svg";
import FailedIcon from "../../icons/close.svg";

export default function Subscription() {
  const [showPlan, setShowPlan] = useState(false);

  return (
    <>
      <div className="w-full h-full flex flex-col gap-4 justify-start items-center text-black dark:text-white">
        <div className="w-full flex flex-col gap-3 px-2.5 pt-1 pb-5">
          <div className="font-medium">Plan</div>
          <div className="flex justify-between items-center gap-5 p-2.5 bg-[#F3F5F7]/30 dark:bg-[#232627]/30 border border-[#E8ECEF] dark:border-[#232627] rounded-sm text-sm">
            <div className="text-sm flex-1">Standard Plan</div>
            <div
              className="text-main underline hover:opacity-70 cursor-pointer"
              onClick={() => setShowPlan(true)}
            >
              Details
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
              className="relative flex flex-col gap-6 p-6 w-72 h-127 bg-[#ECEFF3] rounded-xl overflow-hidden"
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
                <p className="text-[32px] font-light z-1">Starter Plan</p>
                <div className="flex items-end gap-3">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    Free
                  </span>
                  <span className="text-2xl pb-2">/month</span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  Starter package with basic services
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                  Current Plan
                </Button> */}
              </div>

              <div className="flex justify-between items-center">
                <div className="w-14 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F]">
                  What’s Included :
                </span>
                <div className="w-14 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>Qwen-235B unlimited use</span>
                </div>

                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>Unlimited use of MCP</span>
                </div>
                <div className="flex items-center gap-3">
                  <FailedIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>Does not support multi-modal related functions</span>
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
                  <span className="text-[#C8FF85]">Standard</span> Plan
                </p>
                <div className="flex items-end gap-3 z-1">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    $19
                  </span>
                  <span className="text-2xl pb-2">/month</span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  Giving advanced services
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                 Get Started
                </Button> */}
              </div>

              <div className="flex justify-between items-center">
                <div className="w-14 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F]">
                  What’s Included :
                </span>
                <div className="w-14 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-4 text-sm text-[#00D47E]">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>Access all function of Free Plan</span>
                </div>

                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0" />
                  <span>
                    Unlimited use on all Aiden Access models (most models)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 " />
                  <span>Unlimited use of multi-modal related functions</span>
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
                  <span className="text-[#C89CFF]">Pro</span> Plan
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-[64px] leading-[77px] font-extralight">
                    $199
                  </span>
                  <span className="text-2xl pb-2">/month</span>
                </div>
                <p className="text-[15px] whitespace-nowrap font-extralight">
                  Ultimalt Solutions
                </p>
                {/* <Button className="bg-black h-12 rounded-full px-6 py-2">
                  Current Plan
                </Button> */}
              </div>

              <div className="flex justify-between items-center">
                <div className="w-14 h-[1px] bg-[#C1C7D0] -ml-6"></div>
                <span className="text-lg text-[#6F6F6F]">
                  What’s Included :
                </span>
                <div className="w-14 h-[1px] bg-[#C1C7D0] -mr-6"></div>
              </div>
              <div className="flex flex-col gap-4 text-sm text-[#C8B1FF]">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>Access all functions</span>
                </div>

                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>More advanced models are unlimited </span>
                </div>
                <div className="flex items-center gap-3">
                  <SuccessIcon className="size-6 shrink-0 text-[#4ADE80]" />
                  <span>Priority response in case of congestion</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
