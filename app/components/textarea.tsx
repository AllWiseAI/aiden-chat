import { useEffect, useRef, ChangeEventHandler } from "react";

interface TextareaProps {
  id?: string;
  className?: string;
  rows?: number;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLTextAreaElement> | undefined;
}

export default function Textarea({
  id,
  className,
  rows,
  placeholder,
  value,
  onChange,
}: TextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    handleInput();
  }, [value]);

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + 2 + "px"; // border: 2px
    }
  };

  return (
    <textarea
      className={className}
      ref={textareaRef}
      id={id}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        handleInput();
      }}
    />
  );
}
