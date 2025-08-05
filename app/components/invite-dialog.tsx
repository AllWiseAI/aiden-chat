import { Dispatch } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "./shadcn/dialog";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: Dispatch<React.SetStateAction<boolean>>;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-150 h-95 rounded-sm gap-5 p-5 pb-0 bg-[#FEFEFE] dark:bg-[#101213]"
        closeIcon
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg text-center dark:text-[#FEFEFE] font-normal">
            Invitation
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[#FEFEFE] dark:bg-[#101213]">
              <tr className="h-[22px]">
                <th className="w-1/3 h-full px-2 text-center font-normal">
                  Invitation code
                </th>
                <th className="w-1/3 h-full px-2 text-center font-normal">
                  Status
                </th>
                <th className="w-1/3 h-full px-2 text-center font-normal">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="border-y-[14px] border-y-transparent">
              <tr className="h-[32px] border-b-[14px] border-b-transparent">
                <td className="text-center">DX45AD</td>
                <td className="text-center">Status</td>
                <td className="text-center">Share</td>
              </tr>
              <tr className="h-[32px] border-b-[14px] border-b-transparent">
                <td className="text-center">Row‑n</td>
                <td className="text-center">…</td>
                <td className="text-center">…</td>
              </tr>
              <tr className="h-[32px] border-b-[14px] border-b-transparent">
                <td className="text-center">Row‑n</td>
                <td className="text-center">…</td>
                <td className="text-center">…</td>
              </tr>
              <tr className="h-[32px] border-b-[14px] border-b-transparent">
                <td className="text-center">Row‑n</td>
                <td className="text-center">…</td>
                <td className="text-center">…</td>
              </tr>
              <tr className="h-[32px] border-b-[14px] border-b-transparent">
                <td className="text-center">Row‑n</td>
                <td className="text-center">…</td>
                <td className="text-center">…</td>
              </tr>
            </tbody>
          </table>
        </div>

        <DialogFooter className="!justify-center text-xs font-medium  text-main">
          Seed users enjoy 3-month free after launch
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
