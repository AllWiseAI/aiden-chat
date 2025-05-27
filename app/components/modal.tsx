"use client";
import React, { ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/shadcn/dialog";

export type ModalProps = {
  title?: string;
  description?: string;
  content: ReactNode;
  onClose?: () => void;
  dialogClassName?: string;
};

function Modal({
  title,
  description,
  content,
  onClose,
  dialogClassName,
}: ModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose?.();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={dialogClassName}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div>{content}</div>
      </DialogContent>
    </Dialog>
  );
}

export function showModal(props: ModalProps) {
  const div = document.createElement("div");
  document.body.appendChild(div);

  const root = createRoot(div);

  const closeModal = () => {
    props.onClose?.();
    root.unmount();
    div.remove();
    // 强制清除style
    document.body.removeAttribute("style");
  };

  div.onclick = (e) => {
    if (e.target === div) {
      closeModal();
    }
  };

  root.render(<Modal {...props} onClose={closeModal} />);
}
