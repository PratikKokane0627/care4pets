import AdminPageHeader from "./AdminPageHeader";
import { Button, Field, Panel } from "../../pages/admin/adminShared";

const FormPage = ({
  title,
  description,
  form,
  setForm,
  onSubmit,
  fields,
  submitText = "Save",
}) => (
  <main>
    <AdminPageHeader title={title} description={description} />
    <Panel>
      <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const fieldName = field.name || field;

          return (
            <Field
              key={fieldName}
              label={(field.label || fieldName).replace(/([A-Z])/g, " $1")}
              type={field.type || "text"}
              as={field.as || "input"}
              options={field.options || []}
              value={form[fieldName] ?? ""}
              onChange={(value) =>
                setForm((current) => ({ ...current, [fieldName]: value }))
              }
              className={field.full ? "md:col-span-2" : ""}
              required={field.required}
            />
          );
        })}
        <div className="md:col-span-2">
          <Button type="submit">{submitText}</Button>
        </div>
      </form>
    </Panel>
  </main>
);

export default FormPage;
