import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/shadcn/alert-dialog";
import { useTranslation } from "react-i18next";

export default function RestartDialog({
  title,
  description,
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("general");

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-sm w-80 dark:text-white gap-5">
        <div className="flex justify-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px]">{title}</AlertDialogTitle>
          </AlertDialogHeader>
        </div>
        <AlertDialogDescription className="text-sm text-center font-normal text-[#141718] dark:text-white">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel className="flex-1 rounded-sm hover:bg-[#F3F5F74D] border border-[#E8ECEF] dark:border-[#343839] font-medium">
            {t("dialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-[#00AB66] hover:bg-[#00AB66]/75 rounded-sm font-medium"
          >
            {t("dialog.restart")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
