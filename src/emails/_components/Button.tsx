import * as React from "react";
import { Button as REButton } from "@react-email/components";
import { color, font } from "./tokens";

export interface BrandButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function BrandButton({ href, children, variant = "primary" }: BrandButtonProps) {
  const isPrimary = variant === "primary";
  const style: React.CSSProperties = {
    backgroundColor: isPrimary ? color.crimson : color.white,
    color: isPrimary ? color.white : color.ink,
    border: isPrimary ? `1px solid ${color.crimson}` : `1px solid ${color.ink}`,
    borderRadius: 999,
    fontFamily: font.sans,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.01em",
    padding: "12px 22px",
    textDecoration: "none",
    display: "inline-block",
  };
  return (
    <REButton href={href} style={style}>
      {children}
    </REButton>
  );
}

export default BrandButton;
