import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/shadcn/dropdown-select-menu";
import { Button } from "@/app/components/shadcn/button";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/app/libs/shadcn/utils";
import ArrowDownIcon from "@/app/icons/arrow-down.svg";
import ArrowUpIcon from "@/app/icons/arrow-up.svg";
import LoadingSpinner from "@/app/icons/loading-spinner.svg";
import GPTIcon from "@/app/icons/gpt.svg";
import { CustomModelOption } from "@/app/typing";

type MultiSelectDropdownProps = {
  className?: string;
  value?: string[];
  options: CustomModelOption[];
  loading?: boolean;
  onChange: (data: string[]) => void;
};

type Option = {
  value: string;
  label: string;
};

export function MultiSelectDropdown({
  className,
  value,
  options,
  onChange,
  loading,
}: MultiSelectDropdownProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (value && value.length) {
      setCheckedItems(value);
    }
  }, [value]);

  const toggleChecked = (key: string) => {
    setCheckedItems((prev) => {
      const updatedData = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      onChange(updatedData);
      return updatedData;
    });
  };

  const selectedLabels = useMemo(() => {
    return options
      .filter((opt: Option) => checkedItems.includes(opt.value))
      .map((opt: Option) => opt.label)
      .join(", ");
  }, [checkedItems, options]);

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
          {loading && (
            <LoadingSpinner className="animate-spin h-4 w-4 opacity-60" />
          )}
          {!loading &&
            (open ? (
              <ArrowUpIcon className="ml-2 h-4 w-4 opacity-60" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4 opacity-60" />
            ))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
        {options.map((opt: Option) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={checkedItems.includes(opt.value)}
            onCheckedChange={() => toggleChecked(opt.value)}
          >
            <div className="flex items-center gap-1">
              <GPTIcon className="h-4 w-4" />
              {opt.label}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
