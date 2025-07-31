import { useEffect, useState } from "react";
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
import { getProviderList } from "@/app/services";
import DeleteDialog from "@/app/components/delete-dialog";
import { toast } from "sonner";
import { ProviderIcon } from "./provider-icon";

export default function ModelList() {
  const modelList: ModelOption[] = useAppConfig((state) => state.models);
  const localProviders = useAppConfig((state) => state.localProviders);
  const setLocalProviders = useAppConfig((state) => state.setLocalProviders);
  const updateLocalProviders = useAppConfig(
    (state) => state.updateLocalProviders,
  );
  const setProviderList = useAppConfig((state) => state.setProviderList);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteLocalProvider = useAppConfig(
    (state) => state.deleteLocalProviders,
  );
  const { t } = useTranslation("settings");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEdit, setIsModalEdit] = useState(false);
  const [currentProviderInfo, setCurrentProviderInfo] =
    useState<ProviderOption>({} as ProviderOption);

  useEffect(() => {
    async function getProviderData() {
      const data = await getProviderList();
      if (data && data.length) {
        setProviderList(data);
      }
    }
    getProviderData();
  }, []);

  const handleAddModel = () => {
    setIsModalEdit(false);
    setIsModalOpen(true);
  };

  const handleModelConfirm = (provider: ProviderOption) => {
    console.log("provider", provider);
    if (isModalEdit) {
      updateLocalProviders(provider);
    } else {
      setLocalProviders(provider);
    }
  };

  const handleEdit = (provider: ProviderOption) => {
    setIsModalEdit(true);
    setCurrentProviderInfo(provider);
    setIsModalOpen(true);
  };

  const handleDelete = (provider: ProviderOption) => {
    setIsDeleteOpen(true);
    setCurrentProviderInfo(provider);
  };

  const confirmDelete = () => {
    if (currentProviderInfo) {
      deleteLocalProvider(currentProviderInfo);
      toast.success(t("model.deleteSuccess"));
    }
    setIsDeleteOpen(false);
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
              {modelList.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium flex gap-2 items-center">
                    <DefaultModelIcon size="4" />
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
              {localProviders.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">
                    <div className="flex gap-2 items-center">
                      <ProviderIcon provider={item.provider} />
                      {item.display}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.models?.map((model) => (
                      <div key={model.value}>{model.label}</div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="size-6 mr-2.5"
                      onClick={() => handleEdit(item)}
                    >
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
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          className="w-30 rounded-sm hover:border hover:border-[#00AB66] hover:text-[#00AB66] dark:hover:border-[#00AB66] hover:bg-transparent"
          onClick={handleAddModel}
        >
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      {isModalOpen && (
        <AddModelModal
          open={isModalOpen}
          isEdit={isModalEdit}
          editInfo={currentProviderInfo}
          onConfirm={handleModelConfirm}
          onOpenChange={() => setIsModalOpen(false)}
        />
      )}
      <DeleteDialog
        title={t("model.deleteModelTitle")}
        description={t("model.deleteModelDescription")}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
        isOpen={isDeleteOpen}
      />
    </div>
  );
}
