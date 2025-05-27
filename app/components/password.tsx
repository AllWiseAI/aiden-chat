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
        className="absolute right-2 size-10 top-1/2 transform -translate-y-1/2 bg-transparent rounded-lg hover:bg-gray-200 transition-colors"
        onClick={handleClick}
      >
        {showPassword ? (
          <EyesIcon className="size-6" />
        ) : (
          <HideIcon className="size-6" />
        )}
      </Button>
    </div>
  );
}
