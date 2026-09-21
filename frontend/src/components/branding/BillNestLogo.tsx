import React from "react";
import logo from "../../assets/images/billnest-logo.png";

interface BillNestLogoProps {
  size?: number;
  className?: string;
}

const BillNestLogo: React.FC<BillNestLogoProps> = ({
  size = 56,
  className = "",
}) => {
  return (
    <img
      src={logo}
      alt="BillNest"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
};

export default BillNestLogo;