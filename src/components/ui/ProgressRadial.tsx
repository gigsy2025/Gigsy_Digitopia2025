/**
 * RADIAL PROGRESS COMPONENT
 *
 * Circular progress indicator with customizable styling,
 * animations, and accessibility features.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressRadialProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg" | "xl";
  thickness?: "thin" | "medium" | "thick";
  showPercentage?: boolean;
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  backgroundColor?: string;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Size configurations
const sizeConfig = {
  sm: {
    size: 40,
    textSize: "text-xs",
    strokeWidth: { thin: 2, medium: 3, thick: 4 },
  },
  md: {
    size: 60,
    textSize: "text-sm",
    strokeWidth: { thin: 3, medium: 4, thick: 6 },
  },
  lg: {
    size: 80,
    textSize: "text-base",
    strokeWidth: { thin: 4, medium: 6, thick: 8 },
  },
  xl: {
    size: 120,
    textSize: "text-lg",
    strokeWidth: { thin: 6, medium: 8, thick: 12 },
  },
};

// Color configurations
const colorConfig = {
  primary: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-yellow-500",
  danger: "stroke-red-500",
  info: "stroke-blue-500",
};

export const ProgressRadial: React.FC<ProgressRadialProps> = ({
  value,
  size = "md",
  thickness = "medium",
  showPercentage = true,
  showValue = false,
  color = "primary",
  backgroundColor = "stroke-muted",
  animated = true,
  className,
  children,
}) => {
  const config = sizeConfig[size];
  const strokeWidth = config.strokeWidth[thickness];
  const radius = (config.size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: config.size, height: config.size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${value}%`}
    >
      <svg
        width={config.size}
        height={config.size}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          className={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          className={cn(
            colorConfig[color],
            animated && "transition-all duration-500 ease-out",
          )}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: animated
              ? "stroke-dashoffset 0.5s ease-out"
              : undefined,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <div
            className={cn(
              "text-foreground text-center font-medium",
              config.textSize,
            )}
          >
            {showPercentage && <div>{Math.round(value)}%</div>}
            {showValue && !showPercentage && <div>{value}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Progress Ring with custom content
 */
export const ProgressRing: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({
  value,
  max = 100,
  size = 60,
  strokeWidth = 4,
  color = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--muted))",
  className,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/**
 * Multi-segment progress ring for showing multiple progress values
 */
export const MultiProgressRing: React.FC<{
  segments: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  strokeWidth?: number;
  gap?: number;
  className?: string;
  children?: React.ReactNode;
}> = ({
  segments,
  size = 80,
  strokeWidth = 6,
  gap = 2,
  className,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let accumulatedValue = 0;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          const segmentLength =
            (percentage / 100) * (circumference - gap * segments.length);
          const offset =
            (accumulatedValue / total) *
              (circumference - gap * segments.length) +
            gap * index;

          accumulatedValue += segment.value;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500 ease-out"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default ProgressRadial;
