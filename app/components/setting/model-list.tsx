import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/shadcn/table";
import Image from "next/image";
import { Button } from "../shadcn/button";
import { useAppConfig, Theme } from "@/app/store";
import { useTheme } from "@/app/hooks/use-theme";
import { ModelOption, ProviderOption } from "@/app/typing";
import EditIcon from "@/app/icons/edit.svg";
import PlusIcon from "@/app/icons/plus.svg";
import DeleteIcon from "@/app/icons/delete.svg";
import { useTranslation } from "react-i18next";
import { AddModelModal } from "./add-model-modal";
import { getProviderList } from "@/app/services";
import DeleteDialog from "@/app/components/delete-dialog";
import { toast } from "@/app/utils/toast";
import DownIcon from "../../icons/down.svg";
import { ProviderIcon } from "./provider-icon";
import { track, EVENTS } from "@/app/utils/analysis";

export default function ModelList() {
  const modelList: ModelOption[] = useAppConfig((state) => state.models);
  const localProviders = useAppConfig((state) => state.localProviders);
  const setLocalProviders = useAppConfig((state) => state.setLocalProviders);
  const updateLocalProviders = useAppConfig(
    (state) => state.updateLocalProviders,
  );
  const setProviderList = useAppConfig((state) => state.setProviderList);
  const initModelList = useAppConfig((state) => state.initModelList);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteLocalProvider = useAppConfig(
    (state) => state.deleteLocalProviders,
  );
  const { t } = useTranslation("settings");
  const [showMore, setShowMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEdit, setIsModalEdit] = useState(false);
  const [currentProviderInfo, setCurrentProviderInfo] =
    useState<ProviderOption>({} as ProviderOption);
  const theme = useTheme();

  useEffect(() => {
    track(EVENTS.SETTING_MODEL_EXPOSURE);
    async function getProviderData() {
      const data = await getProviderList();
      if (data && data.length) {
        setProviderList(data);
      }
    }
    getProviderData();
    initModelList();
  }, []);

  const renderModelList = useMemo(() => {
    if (!showMore) return modelList.slice(0, 6);
    else return modelList;
  }, [showMore, modelList]);

  const handleAddModel = () => {
    setIsModalEdit(false);
    setIsModalOpen(true);
  };

  const handleModelConfirm = (provider: ProviderOption) => {
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
    <div className="gap-2 pb-6 max-w-135 min-w-106">
      <div className="gap-2.5">
        <div className="font-medium text-base mb-2.5">
          {t("model.defaultModel")}
        </div>
        <div className="flex flex-col items-center gap-2.5 w-full">
          <Table className="table-auto">
            <TableHeader>
              <TableRow className="border-[#F3F5F7] dark:border-[#232627]/50">
                <TableHead className="w-1/2 px-2.5">
                  {t("model.provider")}
                </TableHead>
                <TableHead className="px-2.5">{t("model.model")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderModelList.map((model) => (
                <TableRow
                  key={model.id}
                  className="border-[#F3F5F7] dark:border-[#232627]/50"
                >
                  <TableCell className="max-w-1/2 mr-0 px-2.5 py-3.5 h-13 font-medium text-base flex gap-2 items-center">
                    Aiden
                  </TableCell>
                  <TableCell className="w-max px-2.5 py-3.5 h-13 text-sm">
                    <div className="flex items-center gap-1 w-max">
                      <Image
                        src={
                          (theme === Theme.Light
                            ? model.logo_uri
                            : model.dark_logo_uri) ?? ""
                        }
                        height={20}
                        width={20}
                        alt="model"
                      ></Image>
                      {model.display}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!showMore && (
            <Button
              variant="outline"
              className="w-fit gap-1 dark:border-[#232627] dark:hover:bg-[#1B1C1C] rounded-sm"
              onClick={() => setShowMore(true)}
            >
              <DownIcon className="size-[18px]" />
              {t("model.viewMore")}
            </Button>
          )}
        </div>
      </div>
      <div className="mt-6 gap-2">
        <div className="font-medium text-base mb-2.5">
          {t("model.customModel")}
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow className="border-transparent">
                <TableHead className="">{t("model.provider")}</TableHead>
                <TableHead> {t("model.model")}</TableHead>
                <TableHead> {t("model.operation")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {localProviders.map((item) => (
                <TableRow
                  key={item.itemId}
                  className="border-[#F3F5F7] dark:border-[#232627]/50"
                >
                  <TableCell className="px-2.5 py-3.5 font-medium text-base">
                    <div className="flex gap-1 items-center">
                      <ProviderIcon
                        provider={item.provider}
                        className="size-5"
                      />
                      {item.display}
                    </div>
                  </TableCell>
                  <TableCell className="px-2.5 py-3.5 text-[#141718] dark:text-white max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.models?.map((model) => model.label).join(",")}
                  </TableCell>
                  <TableCell className="px-2.5 py-3.5">
                    <Button
                      variant="ghost"
                      className="size-6 mr-2.5"
                      onClick={() => handleEdit(item)}
                    >
                      <EditIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="size-6 text-[#EF466F] hover:text-[#EF466F]/75"
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
          {t("model.add")}
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
