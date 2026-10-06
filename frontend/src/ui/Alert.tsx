import { type ComponentPropsWithoutRef } from "react";

type AlertProps = ComponentPropsWithoutRef<"div"> & { variant?: "info" | "error" };

export function Alert({ variant = "info", role, className = "", ...props }: AlertProps) {
  return <div {...props} role={role ?? (variant === "error" ? "alert" : "status")}
    className={`ui-alert ui-alert--${variant} ${className}`.trim()} />;
}
