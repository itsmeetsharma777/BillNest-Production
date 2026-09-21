import React from "react";

import darkLogo from "../../assets/images/billnest-logo-dark.png";
import lightLogo from "../../assets/images/billnest-logo-light.png";
import iconLogo from "../../assets/images/billnest-icon.png";

import { useTheme } from "@/context/theme-context";

interface BillNestLogoProps {
  variant?: "full" | "icon";
  size?: number | string;
  className?: string;
}

const BillNestLogo: React.FC<BillNestLogoProps> = ({
  variant = "full",
  size,
  className = "",
}) => {
  const { resolvedTheme } = useTheme();

  const source =
    variant === "icon"
      ? iconLogo
      : resolvedTheme === "dark"
        ? darkLogo
        : lightLogo;

  const dimension =
    typeof size === "number"
      ? `${size}px`
      : size;

  return (
    <img
      src={source}
      alt="BillNest"
      width={dimension}
      height={dimension}
      className={`object-contain ${className}`}
    />
  );
};

export default BillNestLogo;