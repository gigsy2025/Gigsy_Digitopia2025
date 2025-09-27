"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateGigInput } from "@/lib/validations/gigs";
import type { GigCategory, DifficultyLevel } from "@/types/gigs";
import { cn } from "@/lib/utils";

const categoryOptions: GigCategory[] = [
  "design",
  "development",
  "writing",
  "marketing",
  "data",
  "video",
  "audio",
  "business",
  "other",
];

const difficultyOptions: DifficultyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export function GigFormStepGeneral({ className }: { className?: string }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateGigInput>();

  const selectedCategory = watch("category");
  const selectedDifficulty = watch("difficultyLevel");

  return (
    <div className={cn("grid gap-6", className)}>
      <div className="grid gap-2">
        <Label htmlFor="gig-title">Title</Label>
        <Input
          id="gig-title"
          placeholder="e.g., Senior Frontend Engineer"
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gig-description">Description</Label>
        <Textarea
          id="gig-description"
          rows={6}
          placeholder="Describe the project scope, deliverables, and success criteria."
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="gig-category">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value: GigCategory) =>
              setValue("category", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="gig-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className="capitalize"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category ? (
            <p className="text-destructive text-sm">
              {errors.category.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="gig-difficulty">Difficulty</Label>
          <Select
            value={selectedDifficulty}
            onValueChange={(value: DifficultyLevel) =>
              setValue("difficultyLevel", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="gig-difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((difficulty) => (
                <SelectItem
                  key={difficulty}
                  value={difficulty}
                  className="capitalize"
                >
                  {difficulty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.difficultyLevel ? (
            <p className="text-destructive text-sm">
              {errors.difficultyLevel.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
