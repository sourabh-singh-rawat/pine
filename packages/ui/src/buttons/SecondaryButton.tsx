import type { ButtonProps } from "./Button";
import Button from "./Button";

export const SecondaryButton = ({ onClick, label, type, form, size }: ButtonProps) => {
  return (
    <Button
      label={label}
      onClick={onClick}
      variant="text"
      color="secondary"
      type={type}
      form={form}
      size={size}
    />
  );
};

export default SecondaryButton;
