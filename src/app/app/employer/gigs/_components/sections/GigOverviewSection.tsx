"use client";

import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
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
import type { GigEditorFormValues } from "@/lib/validations/gigEditor";
import {
  GIG_EDITOR_CATEGORY_OPTIONS,
  GIG_EDITOR_DIFFICULTY_LEVELS,
  GIG_EDITOR_EXPERIENCE_LEVELS,
} from "@/lib/validations/gigEditor";

import { useGigSkillManager } from "../hooks/useGigSkillManager";

export function GigOverviewSection() {
  const form = useFormContext<GigEditorFormValues>();
  const { pendingSkill, setPendingSkill, handleAddSkill, handleRemoveSkill } =
    useGigSkillManager({ form });

  const skills = form.watch("skills");

  return (
    <section className="border-border rounded-2xl border p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-muted-foreground text-sm">
          Update the details candidates see when browsing this gig.
        </p>
      </header>

      <div className="mt-6 space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Title</Label>
              <FormControl>
                <Input {...field} placeholder="Senior React engineer" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Description</Label>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="Describe the scope, responsibilities, and success criteria."
                />
              </FormControl>
              <FormDescription>
                Provide enough context for freelancers to evaluate the opportunity.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor={field.name}>Category</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GIG_EDITOR_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceRequired"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor={field.name}>Experience required</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GIG_EDITOR_EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="difficultyLevel"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Difficulty</Label>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GIG_EDITOR_DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skills"
          render={() => (
            <FormItem>
              <Label>Required skills</Label>
              <div className="flex flex-wrap items-center gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={pendingSkill}
                  onChange={(event) => setPendingSkill(event.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
