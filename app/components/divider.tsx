import React from "react";

interface DividerProps {
  label?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  align = "center",
  className = "",
}) => {
  const justifyClass =
    align === "left"
      ? "justify-start"
      : align === "right"
      ? "justify-end"
      : "justify-center";

  return (
    <div
      className={`flex gap-2 items-center w-full ${justifyClass} ${className}`}
    >
      <div className="flex-grow w-full border-t border-[#E8ECEF]  dark:border-[#343839]  dark:border-opacity-50" />
      {label && (
        <span className="mx-3 text-[#6C7275]/50 text-sm whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-grow border-t w-full border-[#E8ECEF]  dark:border-[#343839]  dark:border-opacity-50" />
    </div>
  );
};
