/**
 * SLIDER COMPONENT
 *
 * Accessible range slider component for video progress, volume control, and other range inputs.
 * Built with native HTML input[type="range"] for maximum compatibility.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  max: number;
  min?: number;
  step?: number;
  onValueChange: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      max,
      min = 0,
      step = 1,
      onValueChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([Number(e.target.value)]);
    };

    return (
      <div
        className={cn(
          "relative flex w-full touch-none items-center select-none",
          className,
        )}
      >
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] ?? 0}
          onChange={handleChange}
          disabled={disabled}
          className="[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
          {...props}
        />
      </div>
    );
  },
);

Slider.displayName = "Slider";

export { Slider };
