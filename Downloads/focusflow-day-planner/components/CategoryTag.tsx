import React from "react";
import { TaskCategory } from "../types.ts";
import { CATEGORY_CONFIG } from "../constants.ts";

interface CategoryTagProps {
  category: TaskCategory;
  size?: "sm" | "md";
}

export default function CategoryTag({
  category,
  size = "sm",
}: CategoryTagProps) {
  const config = CATEGORY_CONFIG[category];

  if (!config) return null;

  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.bgColor} ${config.darkBgColor} ${config.color}`}
    >
      {config.label}
    </span>
  );
}
