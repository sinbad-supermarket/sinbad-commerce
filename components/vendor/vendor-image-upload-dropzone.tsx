"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

type VendorImageUploadDropzoneProps = {
  action: (formData: FormData) => void | Promise<void>;
  children?: ReactNode;
  disabled?: boolean;
  helperText: string;
  imageRole: "primary" | "additional";
  title: string;
};

export function VendorImageUploadDropzone({
  action,
  children,
  disabled = false,
  helperText,
  imageRole,
  title,
}: VendorImageUploadDropzoneProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function submitSelectedFile() {
    formRef.current?.requestSubmit();
  }

  return (
    <div className="seller-upload-form">
      <form action={action} className="seller-upload-action-form" ref={formRef}>
        <input name="image_role" type="hidden" value={imageRole} />
        <label
          className={`seller-upload-zone${isDragging ? " is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);

            const file = event.dataTransfer.files.item(0);
            if (!file || !inputRef.current || disabled) {
              return;
            }

            const transfer = new DataTransfer();
            transfer.items.add(file);
            inputRef.current.files = transfer.files;
            submitSelectedFile();
          }}
        >
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            name="image"
            onChange={submitSelectedFile}
            ref={inputRef}
            required
            type="file"
          />
          <span className="seller-upload-icon">+</span>
          <strong>{title}</strong>
          <span>{helperText}</span>
        </label>
      </form>
      {children}
    </div>
  );
}
