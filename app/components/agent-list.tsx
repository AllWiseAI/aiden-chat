import { useState, useEffect } from "react";
import { Label } from "@/app/components/shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "./shadcn/dialog";
import { Input } from "./shadcn/input";
import { Switch } from "./shadcn/switch";
import { Button } from "./shadcn/button";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

interface AgentItemProps {
  item: {
    id: number;
    name: string;
    avatar: string;
    type: string;
    description: string;
    model: string;
  };
  onEdit: (item: AgentItemProps["item"]) => void;
}

function AgentItem({ item, onEdit }: AgentItemProps) {
  return (
    <div
      key={item.id}
      className="flex flex-col justify-between gap-4 border border-[#E8ECEF] dark:border-[#232627] rounded-sm px-2.5 py-3"
    >
      <div className="flex gap-2.5">
        <div className="size-7.5 rounded-full bg-[#F3F5F7] dark:bg-[#232627]"></div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#141718] dark:text-[#FEFEFE]">
              {item.name}
            </span>
            {item.type === "default" ? (
              <div className="bg-[#E8ECEF] dark:bg-[#343839] text-[#6C7275] dark:text-[#E8ECEF] rounded-2xl text-xs w-max px-1.5 py-0.5">
                Default
              </div>
            ) : (
              <Switch />
            )}
          </div>
          <span className="text-xs text-[#6C7275] leading-4.5 line-clamp-3">
            {item.description}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>Model</div>
        <Button
          onClick={() => onEdit(item)}
          className="h-7 bg-transparent text-main text-sm font-medium border border-main hover:bg-[#00AB66] dark:hover:bg-[#00D47E] hover:text-[#FEFEFE] dark:hover:text-[#101213]"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}

function AgentEditDialog({
  open,
  item,
  onOpenChange,
}: {
  open: boolean;
  item: AgentItemProps["item"] | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("general");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col items-center"
        closeIcon={false}
        dismissible={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle>Edit Agent</DialogTitle>
        <div className="flex flex-col gap-4 w-full text-sm font-normal">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="avatar" className="text-[#6C7275] w-max">
              Avatar
            </Label>
            <div>111</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-[#6C7275] w-max">
              Name
            </Label>
            <Input id="name" value={item?.name} className="!text-left" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-[#6C7275] w-max">
              Description
            </Label>
            <Input id="description" value={item?.description} />
          </div>
        </div>
        <DialogFooter className="ml-auto gap-2.5 w-full max-w-75 h-9">
          <Button
            className="flex-1 bg-white rounded-sm hover:bg-[#F3F5F74D] dark:bg-[#141718] dark:border-[#343839] dark:hover:bg-[#141718]/8 text-[#6C7275] dark:text-[#FEFEFE] border border-[#6C7275]/10 px-2.5 py-2 mr-0"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t("dialog.cancel")}
          </Button>

          <Button className="flex-1 rounded-sm">{t("dialog.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AgentList() {
  const [showEdit, setShowEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    AgentItemProps["item"] | null
  >(null);

  const params = useSearchParams();
  const [searchParams] = params;
  const navigate = useNavigate();
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      const found = agentArr.find((item) => item.id === Number(id));
      if (found) {
        setSelectedItem(found);
        setShowEdit(true);
      }
    }
  }, [id]);

  const agentArr = [
    {
      id: 1,
      name: "Multimodal Agent",
      avatar: "",
      type: "default",
      description:
        "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
      model: "",
    },
    {
      id: 2,
      name: "Text Agent",
      avatar: "",
      type: "default",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      model: "",
    },
    {
      id: 3,
      name: "Product Manager",
      avatar: "",
      type: "custom",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      model: "",
    },
    {
      id: 4,
      name: "Coding Assistant",
      avatar: "",
      type: "custom",
      description: "",
      model: "",
    },
    {
      id: 5,
      name: "Coding Assistant",
      avatar: "",
      type: "custom",
      description: "",
      model: "",
    },
    {
      id: 6,
      name: "Strategic Product Manager",
      avatar: "",
      type: "custom",
      description: "",
      model: "",
    },
  ];
  return (
    <>
      <div className="grid grid-cols-1 @xss:grid-cols-2 @headerMd:grid-cols-3 gap-3.5">
        {agentArr.map((item) => (
          <AgentItem
            item={item}
            key={item.id}
            onEdit={(agent) => {
              setSelectedItem(agent);
              setShowEdit(true);
            }}
          />
        ))}
      </div>
      {showEdit && (
        <AgentEditDialog
          open={showEdit}
          item={selectedItem}
          onOpenChange={(o) => {
            searchParams.delete("id");
            navigate(`?${params.toString()}`, { replace: true });
            setShowEdit(o);
          }}
        />
      )}
    </>
  );
}
