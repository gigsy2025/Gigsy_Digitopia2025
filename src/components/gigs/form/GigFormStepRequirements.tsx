"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreateGigInput } from "@/lib/validations/gigs";
import type { ExperienceLevel } from "@/types/gigs";

const experienceOptions: ExperienceLevel[] = [
  "entry",
  "intermediate",
  "senior",
  "expert",
];

const suggestedSkills = [
  "React",
  "TypeScript",
  "Node.js",
  "GraphQL",
  "TailwindCSS",
  "Next.js",
  "Docker",
  "Kubernetes",
  "AWS",
  "Python",
  "Figma",
  "UI/UX",
  "Copywriting",
  "SEO",
  "Data Analysis",
];

export function GigFormStepRequirements({ className }: { className?: string }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateGigInput>();

  const selectedExperience = watch("experienceRequired");
  const selectedSkills = watch("skills") ?? [];

  const [customSkill, setCustomSkill] = useState("");

  const remainingSuggestions = useMemo(
    () => suggestedSkills.filter((skill) => !selectedSkills.includes(skill)),
    [selectedSkills],
  );

  const handleAddSkill = (skill: string) => {
    const normalizedSkill = skill.trim();
    if (!normalizedSkill || selectedSkills.includes(normalizedSkill)) {
      return;
    }

    const updatedSkills = [...selectedSkills, normalizedSkill];
    setValue("skills", updatedSkills, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleRemoveSkill = (skill: string) => {
    const updatedSkills = selectedSkills.filter(
      (existingSkill) => existingSkill !== skill,
    );
    setValue("skills", updatedSkills, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCustomSkillSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleAddSkill(customSkill);
    setCustomSkill("");
  };

  const toggleSuggestedSkill = (skill: string, isSelected: boolean) => {
    if (isSelected) {
      handleRemoveSkill(skill);
      return;
    }
    handleAddSkill(skill);
  };

  return (
    <div className={cn("grid gap-6", className)}>
      <div className="grid gap-2">
        <Label>Required skills</Label>
        <div className="flex flex-wrap gap-2">
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="hover:bg-secondary/70 flex items-center gap-2 transition-colors"
              >
                {skill}
                <button
                  type="button"
                  className="text-destructive text-xs tracking-wide uppercase"
                  onClick={() => handleRemoveSkill(skill)}
                >
                  Remove
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              Add at least one skill to continue.
            </p>
          )}
        </div>

        {errors.skills ? (
          <p className="text-destructive text-sm">{errors.skills.message}</p>
        ) : null}

        <form
          onSubmit={handleCustomSkillSubmit}
          className="flex items-center gap-2"
        >
          <Input
            value={customSkill}
            placeholder="Add custom skill and press Enter"
            onChange={(event) => setCustomSkill(event.target.value)}
          />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      </div>

      <div className="grid gap-3">
        <Label>Suggested skills</Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {remainingSuggestions.map((skill) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <div
                key={skill}
                className={cn(
                  "flex items-center justify-between rounded-md border p-3 text-sm transition",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/60",
                )}
              >
                <span className="capitalize">{skill}</span>
                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? "secondary" : "outline"}
                  onClick={() => toggleSuggestedSkill(skill, isSelected)}
                >
                  {isSelected ? "Remove" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gig-experience">Experience level</Label>
        <select
          id="gig-experience"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          value={selectedExperience}
          {...register("experienceRequired")}
        >
          <option value="">Select experience level</option>
          {experienceOptions.map((option) => (
            <option key={option} value={option} className="capitalize">
              {option}
            </option>
          ))}
        </select>
        {errors.experienceRequired ? (
          <p className="text-destructive text-sm">
            {errors.experienceRequired.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
