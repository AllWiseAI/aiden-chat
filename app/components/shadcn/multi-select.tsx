import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/shadcn/dropdown-select-menu";
import { Button } from "@/app/components/shadcn/button";
import { useState, useMemo } from "react";
import { cn } from "@/app/libs/shadcn/utils";
import ArrowDownIcon from "@/app/icons/arrow-down.svg";
import ArrowUpIcon from "@/app/icons/arrow-up.svg";
import GPTIcon from "@/app/icons/gpt.svg";

type MultiSelectDropdownProps = {
  className?: string;
  options: [];
};

export function MultiSelectDropdown({
  className,
  options,
}: MultiSelectDropdownProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const toggleChecked = (key: string) => {
    setCheckedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const selectedLabels = useMemo(() => {
    return options
      .filter((opt) => checkedItems.includes(opt.model))
      .map((opt) => opt.display)
      .join(", ");
  }, [checkedItems]);

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "!hover:bg-none min-w-56 justify-between pr-3 truncate",
            className,
          )}
        >
          <span className="truncate font-normal text-sm">{selectedLabels}</span>
          {open ? (
            <ArrowUpIcon className="ml-2 h-4 w-4 opacity-60" />
          ) : (
            <ArrowDownIcon className="ml-2 h-4 w-4 opacity-60" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="!w-10">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.model}
            checked={checkedItems.includes(opt.model)}
            onCheckedChange={() => toggleChecked(opt.model)}
            disabled={opt.disabled}
          >
            <div className="flex items-center gap-1">
              <GPTIcon className="h-4 w-4" />
              {opt.display}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
