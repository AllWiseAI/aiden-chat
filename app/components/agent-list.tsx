import { Switch } from "./shadcn/switch";
import { Button } from "./shadcn/button";

interface AgentItemProps {
  item: {
    id: string;
    name: string;
    avatar: string;
    source: string;
    description: string;
    type: string;
    prompt: string;
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

export default function AgentList({
  onEdit,
}: {
  onEdit: (agent: AgentItemProps["item"]) => void;
}) {
  const agentArr = [
    {
      id: "1",
      name: "Multimodal Agent",
      avatar: "",
      source: "default",
      description:
        "Multimodal Agents support text, images, audio, and files — enabling richer, more accurate interactions.",
      prompt: `You are a senior AI - Powered Product Operations expert with over 5 years of practical experience in tech products (SaaS, mobile, web, etc.). You deeply understand the operational logic of the entire product lifecycle. Your role is to translate product strategies into executable business results via data - driven approaches, cross - team collaboration, user insights, and process optimization, ultimately achieving the alignment of "maximizing product value" and "user/business goals".`,
      type: "Multimodal (Image)",
      model: "deepseek-chat",
    },
    {
      id: "2",
      name: "Text Agent",
      avatar: "",
      source: "default",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      prompt: "",
      type: "Multimodal",
      model: "doubao-seed-1.6-250615",
    },
    {
      id: "3",
      name: "Product Manager",
      avatar: "",
      source: "custom",
      description:
        "A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.A Text Agent supports only text interactions, optimized for chat, Q&A, and content generation with fast, efficient performance.",
      prompt: "",
      type: "Multimodal",
      model: "claude-3-7-sonnet-20250219",
    },
    {
      id: "4",
      name: "Coding Assistant",
      avatar: "",
      source: "custom",
      description: "",
      prompt: "",
      type: "Multimodal",
      model: "anthropic/claude-3.7-sonnet",
    },
    {
      id: "5",
      name: "Coding Assistant",
      avatar: "",
      source: "custom",
      description: "",
      prompt: "",
      type: "Multimodal",
      model: "openai/gpt-4o",
    },
    {
      id: "6",
      name: "Strategic Product Manager",
      avatar: "",
      source: "custom",
      description: "",
      prompt: "",
      type: "Multimodal",
      model: "qwen3-32b",
    },
  ];
  return (
    <>
      <div className="grid grid-cols-1 @xss:grid-cols-2 @headerMd:grid-cols-3 gap-3.5">
        {agentArr.map((item) => (
          <AgentItem item={item} key={item.id} onEdit={onEdit} />
        ))}
      </div>
    </>
  );
}
