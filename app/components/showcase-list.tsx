import { useEffect, useState, useRef } from "react";
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
  const [maxShow, setMaxShow] = useState(3);

  const { t } = useTranslation("general");

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [layoutWidth, setLayoutWidth] = useState<number>(776); // 默认三列
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      const width = containerRef.current?.offsetWidth ?? window.innerWidth;
      setContainerWidth(width);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    if (containerWidth < 504) {
      setLayoutWidth(243);
      setMaxShow(3);
    } else if (containerWidth < 776) {
      setLayoutWidth(509);
      setMaxShow(2);
    } else {
      setLayoutWidth(776);
      setMaxShow(3);
    }
  }, [containerWidth]);

  useEffect(() => {
    getShowcaseList().then((res: ShowcaseListOption[]) => {
      const sortedList = res.sort((a, b) => a.order - b.order);

      setShowcaseList(sortedList);
      setConfigShowcaseList(sortedList);
    });
  }, []);

  const visibleList = showAll ? showcaseList : showcaseList.slice(0, maxShow);

  return (
    <>
      <div className="w-80 mx-auto mt-1 mb-4">
        <Divider label={t("chat.explore")} className="text-[#6F6F6F] text-lg" />
      </div>

      <div ref={containerRef} className="mx-auto transition-all duration-300">
        <div
          className="flex flex-wrap justify-start gap-[23px] mx-auto"
          style={{ width: layoutWidth }}
        >
          {visibleList.map((item) => (
            <div
              key={item.id}
              onClick={() => shell.open(item.url)}
              className="cursor-pointer h-[154px] aspect-[16/9] w-[243px] bg-white rounded-lg shadow-md transition hover:shadow-lg"
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
      </div>
    </>
  );
}
