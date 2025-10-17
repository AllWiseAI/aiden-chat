import { useEffect, useState } from "react";
import { getShowcaseList } from "@/app/services/showcase";
import { ShowcaseListOption } from "@/app/typing";
import { shell } from "@tauri-apps/api";
import { Divider } from "@/app/components/divider";
import { useTranslation } from "react-i18next";
import { useAppConfig } from "@/app/store/config";

export default function ShowcaseList() {
  const {
    showcaseList: configShowcaseList,
    setShowcaseList: setConfigShowcaseList,
  } = useAppConfig();

  const [showcaseList, setShowcaseList] = useState<ShowcaseListOption[]>([
    ...configShowcaseList,
  ]);
  const [showAll, setShowAll] = useState(false);

  const { t } = useTranslation("general");

  useEffect(() => {
    getShowcaseList().then((res) => {
      setShowcaseList([...res]);
      setConfigShowcaseList([...res]);
    });
  }, []);

  const visibleList = showAll ? showcaseList : showcaseList.slice(0, 3); // ✅ 只显示前三个

  return (
    <>
      <div className="w-80 mx-auto mt-1 mb-4">
        <Divider label={t("chat.explore")} className="text-[#6F6F6F] text-lg" />
      </div>

      <div className="flex flex-wrap justify-start gap-6">
        {visibleList.map((item) => (
          <div
            key={item.id}
            onClick={() => shell.open(item.url)}
            className="cursor-pointer h-39 aspect-[16/9] overflow-hidden w-full sm:w-[calc(33.333%-1rem)] bg-white rounded-lg shadow-md transition hover:shadow-lg"
          >
            <img
              src={item.banner}
              alt="showcase"
              className="w-full h-full rounded-md object-cover"
            />
          </div>
        ))}
      </div>

      {showcaseList.length > 3 && !showAll && (
        <div className="w-full text-center mt-4">
          <button
            onClick={() => setShowAll(true)}
            className="border-[#00D47E] border text-lg text-[#6F6F6F] px-4 rounded-2xl cursor-pointer"
          >
            {t("chat.more")}
          </button>
        </div>
      )}
    </>
  );
}
