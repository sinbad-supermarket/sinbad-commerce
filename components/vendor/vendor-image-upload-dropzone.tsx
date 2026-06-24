"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

type VendorImageUploadDropzoneProps = {
  children?: ReactNode;
  disabled?: boolean;
  helperText: string;
  imageRole: "primary" | "additional";
  onFileSelected: (file: File, imageRole: "primary" | "additional") => void;
  title: string;
};

export function VendorImageUploadDropzone({
  children,
  disabled = false,
  helperText,
  imageRole,
  onFileSelected,
  title,
}: VendorImageUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function selectFile(file: File | null) {
    if (!file || disabled) {
      return;
    }

    onFileSelected(file, imageRole);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="seller-upload-form">
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
          selectFile(event.dataTransfer.files.item(0));
        }}
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
          ref={inputRef}
          type="file"
        />
        <span className="seller-upload-icon">+</span>
        <strong>{title}</strong>
        <span>{helperText}</span>
      </label>
      {children}
    </div>
  );
}
