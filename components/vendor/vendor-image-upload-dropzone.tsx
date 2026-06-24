"use client";

import { useRef, useState } from "react";

type VendorImageUploadDropzoneProps = {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
};

export function VendorImageUploadDropzone({
  action,
  disabled = false,
}: VendorImageUploadDropzoneProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function submitSelectedFile() {
    formRef.current?.requestSubmit();
  }

  return (
    <form action={action} className="seller-upload-form" ref={formRef}>
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
        <strong>Upload product images</strong>
        <span>Drag images here or click to browse</span>
      </label>
    </form>
  );
}
