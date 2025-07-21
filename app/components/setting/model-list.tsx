import { useState } from "react";
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
import { ModelOption, ProviderOption } from "@/app/typing";
import EditIcon from "@/app/icons/edit.svg";
import PlusIcon from "@/app/icons/plus.svg";
import DeleteIcon from "@/app/icons/delete.svg";
import DefaultModelIcon from "@/app/icons/default-model-icon.svg";
import { useTranslation } from "react-i18next";
import { AddModelModal } from "./add-model-modal";
import NoDataIcon from "@/app/icons/no-data.svg";

export default function ModelList() {
  const modelList: ModelOption[] = useAppConfig((state) => state.models);
  const localProviders = useAppConfig((state) => state.localProviders);
  const setLocalProviders = useAppConfig((state) => state.setLocalProviders);
  const deleteLocalProvider = useAppConfig(
    (state) => state.deleteLocalProviders,
  );
  const { t } = useTranslation("settings");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddModel = () => {
    setIsModalOpen(true);
  };

  const handleModelConfirm = (provider: ProviderOption) => {
    setLocalProviders(provider);
  };

  const handleDelete = (provider: ProviderOption) => {
    deleteLocalProvider(provider);
  };

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
                <TableHead className="">{t("model.provider")}</TableHead>
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
                <TableHead className="">{t("model.provider")}</TableHead>
                <TableHead> {t("model.model")}</TableHead>
                <TableHead> {t("model.operation")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {localProviders.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.display}</TableCell>
                  <TableCell>
                    {item.models?.map((model) => model.label).join(",")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" className="size-6 mr-2.5">
                      <EditIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="size-6 text-[#EF466F]"
                      onClick={() => handleDelete(item)}
                    >
                      <DeleteIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {localProviders.length === 0 && (
            <div className="flex justify-center w-full py-4">
              <NoDataIcon />
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <Button variant="outline" className="w-30" onClick={handleAddModel}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      <AddModelModal
        open={isModalOpen}
        isEdit={false}
        onConfirm={handleModelConfirm}
        onOpenChange={() => setIsModalOpen(false)}
      />
    </div>
  );
}
