import React from "react";
import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "medium", color = "#0078d4" }) => {
  return (
    <div className={`loading-spinner ${size}`} style={{ borderTopColor: color }}>
      <div className="spinner-inner"></div>
    </div>
  );
};
