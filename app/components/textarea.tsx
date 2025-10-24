import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  ChangeEventHandler,
  KeyboardEventHandler,
  FormEventHandler,
} from "react";

interface TextareaProps {
  id?: string;
  className?: string;
  rows?: number;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLTextAreaElement> | undefined;
  onInput?: FormEventHandler<HTMLTextAreaElement>;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      className,
      rows,
      placeholder,
      value,
      onChange,
      onInput,
      onKeyDown,
      autoFocus,
      style,
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    useEffect(() => {
      adjustHeight();
    }, [value]);

    const adjustHeight = () => {
      const el = innerRef.current;
      if (!el) return;

      el.style.height = "auto";
      el.style.height = el.scrollHeight + 2 + "px";
    };

    return (
      <textarea
        className={className}
        ref={innerRef}
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          adjustHeight();
        }}
        onInput={onInput}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        style={style}
      />
    );
  },
);

Textarea.displayName = "Textarea";
export default Textarea;
