import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "lg";
  children: ReactNode;
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-sm",
  ghost:
    "bg-transparent text-foreground hover:bg-muted border border-transparent",
  outline:
    "bg-background text-foreground border border-border hover:bg-muted",
  secondary:
    "bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/90"
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base"
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
