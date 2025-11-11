import { useEffect, useState, useRef } from "react";
import { getShowcaseList } from "@/app/services/showcase";
import { ShowcaseListOption } from "@/app/typing";
import { open } from "@tauri-apps/plugin-shell";
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
    } else if (containerWidth < 776) {
      setLayoutWidth(509);
    } else {
      setLayoutWidth(776);
    }
  }, [containerWidth]);

  useEffect(() => {
    getShowcaseList().then((res: ShowcaseListOption[]) => {
      const sortedList = res.sort((a, b) => a.order - b.order);

      setShowcaseList(sortedList);
      setConfigShowcaseList(sortedList);
    });
  }, []);

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
          {showcaseList.map((item) => (
            <div
              key={item.id}
              onClick={() => open(item.url)}
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
      </div>
    </>
  );
}
