import { Input } from "@/app/components/shadcn/input";
import { Button } from "@/app/components/shadcn/button";
import EyesIcon from "@/app/icons/eyes.svg";
import HideIcon from "@/app/icons/hide.svg";
import { useState } from "react";
import { cn } from "@/app/libs/shadcn/utils";

export function Password({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = useState(false);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn(className, "!pr-12")}
      />
      <Button
        type="button"
        variant="ghost"
        className="absolute right-2 size-[18px] top-1/2 transform -translate-y-1/2 bg-transparent rounded-lg hover:bg-gray-200 transition-colors dark:text-[#6C7275] !px-[2px]"
        onClick={handleClick}
      >
        {showPassword ? (
          <EyesIcon type="button" className="size-[18px]" />
        ) : (
          <HideIcon type="button" className="size-[18px]" />
        )}
      </Button>
    </div>
  );
}
