"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-card border border-card-border shadow-lg w-full max-w-lg mx-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-7 py-5 border-b border-card-border">
          <h2 className="font-headline font-bold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
