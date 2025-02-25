import { Label } from "./label";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: React.ReactNode;
}

export function FormField({ label, children, className, ...props }: FormFieldProps) {
  return (
    <div className={className} {...props}>
      {label && <Label className="mb-2">{label}</Label>}
      {children}
    </div>
  );
} 