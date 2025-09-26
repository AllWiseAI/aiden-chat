import { useAgentStore } from "../store";
import { Agent } from "../typing";
import { Switch } from "./shadcn/switch";
import { Button } from "./shadcn/button";

interface AgentItemProps {
  item: Agent;
  onEdit: (item: AgentItemProps["item"]) => void;
}

function AgentItem({ item, onEdit }: AgentItemProps) {
  return (
    <div
      key={item.id}
      className="flex flex-col justify-between gap-4 border border-[#E8ECEF] dark:border-[#232627] rounded-sm px-2.5 py-3"
    >
      <div className="flex gap-2.5">
        <div className="size-7.5 flex-center cursor-default rounded-full bg-[#F3F5F7] dark:bg-[#232627]">
          {item.avatar}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#141718] dark:text-[#FEFEFE]">
              {item.name}
            </span>
            {item.source === "default" ? (
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
  const agentArr = useAgentStore((state) => state.agents);

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
