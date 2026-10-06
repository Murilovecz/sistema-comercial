import { type ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", type = "button", className = "", ...props }: ButtonProps) {
  return <button {...props} type={type} className={`ui-button ui-button--${variant} ${className}`.trim()} />;
}
