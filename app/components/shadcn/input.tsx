import * as React from "react";
import { cn } from "@/app/libs/shadcn/utils";
import CloseCircleIcon from "@/app/icons/close-circle.svg";

interface InputProps extends React.ComponentProps<"input"> {
  clearable?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, clearable, ...props }, forwardedRef) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const hasContent = (props.value?.toString() ?? "").length > 0;

    const mergedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (!forwardedRef) return;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else {
          (
            forwardedRef as React.MutableRefObject<HTMLInputElement | null>
          ).current = node;
        }
      },
      [forwardedRef],
    );

    const handleClear = () => {
      if (inputRef.current) {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(inputRef.current, "");

        const event = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    };
    return (
      <div className="relative w-full">
        <input
          ref={mergedRef}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-[#6C7275]/50 dark:placeholder:text-[#343839] selection:text-primary-foreground dark:bg-input/30 border-[#E8ECEF] dark:border-[#232627] flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            // "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            { "!pr-10": clearable },
            className,
          )}
          {...props}
        />
        {clearable && hasContent && (
          <CloseCircleIcon
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full size-[18px] hover:cursor-pointer hover:opacity-70 transition-colors"
            variant="ghost"
            size="icon"
          />
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
