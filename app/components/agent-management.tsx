import { Button } from "./shadcn/button";
import AgentList from "./agent-list";
import PlusIcon from "../icons/plus.svg";

export default function AgentManagement() {
  return (
    <div className="@container">
      <div className="flex justify-between items-center mb-4">
        <p className="font-medium">Aiden Agent</p>
        <Button className="flex items-center gap-2 h-7 bg-[#00AB66]/12 dark:bg-[#00D47E]/6 hover:bg-[#BEF0DD] dark:hover:bg-[#00D47E]/12 text-main text-sm font-normal rounded-sm">
          <PlusIcon className="size-4" />
          <span>Add Agent</span>
        </Button>
      </div>
      <AgentList />
    </div>
  );
}
