type ProductImageUploadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function ProductImageUploadForm({ action }: ProductImageUploadFormProps) {
  return (
    <form className="admin-form" action={action}>
      <label className="field">
        <span>Image file</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>English alt text</span>
          <input name="alt_text_en" />
        </label>
        <label className="field">
          <span>Arabic alt text</span>
          <input name="alt_text_ar" dir="rtl" />
        </label>
      </div>

      <label className="field">
        <span>Sort order</span>
        <input name="sort_order" type="number" defaultValue={0} required />
      </label>

      <button className="primary-button" type="submit">
        Upload image
      </button>
    </form>
  );
}
