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

export default function DeleteDialog({
  title,
  description,
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("general");

  return (
    <AlertDialog open={isOpen}>
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
          <AlertDialogCancel
            className="flex-1 rounded-sm hover:bg-[#F3F5F74D] border border-[#E8ECEF] dark:border-[#343839] font-medium"
            onClick={onCancel}
          >
            {t("dialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-[#EF466F] hover:bg-[#EF466F]/70 rounded-sm font-medium text-white dark:text-black"
          >
            {t("dialog.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
