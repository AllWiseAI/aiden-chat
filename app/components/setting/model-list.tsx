import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/shadcn/table";
import { Button } from "../shadcn/button";
import { useAppConfig } from "@/app/store";
import { ModelOption } from "@/app/typing";
import EditIcon from "@/app/icons/edit.svg";
import PlusIcon from "@/app/icons/plus.svg";
import DeleteIcon from "@/app/icons/delete.svg";
import DefaultModelIcon from "@/app/icons/default-model-icon.svg";
import { useTranslation } from "react-i18next";

export default function ModelList() {
  const modelList: ModelOption[] = useAppConfig((state) => state.models);
  const { t } = useTranslation("settings");

  return (
    <div className="gap-2 pt-2.5 pb-6">
      <div className="gap-2.5">
        <div className="font-medium text-base mb-2.5">
          {t("model.defaultModel")}
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  {t("model.provider")}
                </TableHead>
                <TableHead> {t("model.model")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelList.slice(0, 4).map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium text-base flex gap-2 items-center">
                    <DefaultModelIcon size="5" />
                    Aiden
                  </TableCell>
                  <TableCell className="text-sm">{model.display}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="mt-6 gap-2">
        <div className="font-medium text-base mb-2.5">
          {t("model.customModel")}
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  {t("model.provider")}
                </TableHead>
                <TableHead> {t("model.model")}</TableHead>
                <TableHead> {t("model.operation")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelList.slice(0, 2).map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">Aiden</TableCell>
                  <TableCell>{model.display}</TableCell>
                  <TableCell>
                    <Button variant="ghost" className="size-6 mr-2.5">
                      <EditIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" className="size-6 text-[#EF466F]">
                      <DeleteIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <Button variant="outline" className="w-30">
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
