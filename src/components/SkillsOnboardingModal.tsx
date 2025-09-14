/**
 * SKILLS ONBOARDING MODAL COMPONENT
 *
 * Responsive modal with shadcn components for skills selection,
 * featuring search, categories, popular skills, and optimistic UI.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Search, X, Star, TrendingUp, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

import {
  SkillsFormSchema,
  type SkillsFormData,
  type Skill,
  type SkillCategory,
} from "@/types/skills";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Curated skills catalog for demo
 */
const SKILLS_CATALOG: Skill[] = [
  // Development - Popular
  {
    id: "javascript",
    name: "JavaScript",
    category: "development",
    isPopular: true,
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "development",
    isPopular: true,
  },
  { id: "react", name: "React", category: "development", isPopular: true },
  { id: "nextjs", name: "Next.js", category: "development", isPopular: true },
  { id: "nodejs", name: "Node.js", category: "development", isPopular: true },
  { id: "python", name: "Python", category: "development", isPopular: true },

  // Development - Others
  { id: "java", name: "Java", category: "development" },
  { id: "csharp", name: "C#", category: "development" },
  { id: "php", name: "PHP", category: "development" },
  { id: "go", name: "Go", category: "development" },
  { id: "rust", name: "Rust", category: "development" },
  { id: "swift", name: "Swift", category: "development" },
  { id: "kotlin", name: "Kotlin", category: "development" },
  { id: "flutter", name: "Flutter", category: "development" },
  { id: "vue", name: "Vue.js", category: "development" },
  { id: "angular", name: "Angular", category: "development" },

  // Design - Popular
  { id: "uiux", name: "UI/UX Design", category: "design", isPopular: true },
  { id: "figma", name: "Figma", category: "design", isPopular: true },
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    category: "design",
    isPopular: true,
  },

  // Design - Others
  { id: "illustrator", name: "Adobe Illustrator", category: "design" },
  { id: "sketch", name: "Sketch", category: "design" },
  { id: "canva", name: "Canva", category: "design" },
  { id: "prototyping", name: "Prototyping", category: "design" },
  { id: "wireframing", name: "Wireframing", category: "design" },

  // Marketing - Popular
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    category: "marketing",
    isPopular: true,
  },
  {
    id: "social-media",
    name: "Social Media Marketing",
    category: "marketing",
    isPopular: true,
  },
  { id: "seo", name: "SEO", category: "marketing", isPopular: true },

  // Marketing - Others
  { id: "google-ads", name: "Google Ads", category: "marketing" },
  { id: "facebook-ads", name: "Facebook Ads", category: "marketing" },
  { id: "content-marketing", name: "Content Marketing", category: "marketing" },
  { id: "email-marketing", name: "Email Marketing", category: "marketing" },

  // Writing - Popular
  {
    id: "copywriting",
    name: "Copywriting",
    category: "writing",
    isPopular: true,
  },
  {
    id: "content-writing",
    name: "Content Writing",
    category: "writing",
    isPopular: true,
  },

  // Writing - Others
  { id: "technical-writing", name: "Technical Writing", category: "writing" },
  { id: "creative-writing", name: "Creative Writing", category: "writing" },
  { id: "blog-writing", name: "Blog Writing", category: "writing" },

  // Data - Popular
  {
    id: "data-analysis",
    name: "Data Analysis",
    category: "data",
    isPopular: true,
  },
  { id: "excel", name: "Microsoft Excel", category: "data", isPopular: true },
  { id: "sql", name: "SQL", category: "data", isPopular: true },

  // Data - Others
  { id: "tableau", name: "Tableau", category: "data" },
  { id: "power-bi", name: "Power BI", category: "data" },
  { id: "machine-learning", name: "Machine Learning", category: "data" },

  // Business - Popular
  {
    id: "project-management",
    name: "Project Management",
    category: "business",
    isPopular: true,
  },

  // Business - Others
  { id: "business-analysis", name: "Business Analysis", category: "business" },
  { id: "consulting", name: "Consulting", category: "business" },
  { id: "finance", name: "Finance", category: "business" },
  { id: "sales", name: "Sales", category: "business" },

  // Creative - Popular
  {
    id: "video-editing",
    name: "Video Editing",
    category: "creative",
    isPopular: true,
  },
  {
    id: "photography",
    name: "Photography",
    category: "creative",
    isPopular: true,
  },

  // Creative - Others
  { id: "audio-editing", name: "Audio Editing", category: "creative" },
  { id: "animation", name: "Animation", category: "creative" },
  { id: "3d-modeling", name: "3D Modeling", category: "creative" },

  // Soft Skills - Popular
  {
    id: "communication",
    name: "Communication",
    category: "soft-skills",
    isPopular: true,
  },
  {
    id: "leadership",
    name: "Leadership",
    category: "soft-skills",
    isPopular: true,
  },
  {
    id: "teamwork",
    name: "Teamwork",
    category: "soft-skills",
    isPopular: true,
  },

  // Soft Skills - Others
  { id: "problem-solving", name: "Problem Solving", category: "soft-skills" },
  { id: "time-management", name: "Time Management", category: "soft-skills" },
  {
    id: "critical-thinking",
    name: "Critical Thinking",
    category: "soft-skills",
  },
];

const SKILL_CATEGORIES: {
  value: SkillCategory | "all";
  label: string;
  icon?: React.ReactNode;
}[] = [
  { value: "all", label: "All Skills" },
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "writing", label: "Writing" },
  { value: "data", label: "Data & Analytics" },
  { value: "business", label: "Business" },
  { value: "creative", label: "Creative" },
  { value: "soft-skills", label: "Soft Skills" },
];

interface SkillsOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: SkillsFormData) => Promise<void>;
  onSkip?: () => void;
  allowSkip?: boolean;
  title?: string;
  description?: string;
}

export function SkillsOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onSkip,
  allowSkip = true,
  title = "Choose Your Skills",
  description = "Select the skills that best describe your expertise. This helps us personalize your experience and connect you with relevant opportunities.",
}: SkillsOnboardingModalProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    SkillCategory | "all"
  >("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SkillsFormData>({
    resolver: zodResolver(SkillsFormSchema),
    defaultValues: {
      skills: [],
    },
  });

  const watchedSkills = form.watch("skills");

  // Filter skills based on search and category
  const filteredSkills = useMemo(() => {
    let filtered = SKILLS_CATALOG;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          skill.category.toLowerCase().includes(query),
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (skill) => skill.category === selectedCategory,
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  // Popular skills for quick selection
  const popularSkills = useMemo(
    () => SKILLS_CATALOG.filter((skill) => skill.isPopular).slice(0, 8),
    [],
  );

  // Handle skill selection
  const toggleSkill = useCallback(
    (skillId: string) => {
      const currentSkills = form.getValues("skills");
      const isSelected = currentSkills.includes(skillId);

      if (isSelected) {
        form.setValue(
          "skills",
          currentSkills.filter((id) => id !== skillId),
        );
      } else if (currentSkills.length < 20) {
        form.setValue("skills", [...currentSkills, skillId]);
      }
    },
    [form],
  );

  // Handle form submission
  const handleSubmit = async (data: SkillsFormData) => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
      onClose();
    } catch (error) {
      console.error("Error submitting skills:", error);
      // Could show toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSearchQuery("");
      setSelectedCategory("all");
    }
  }, [isOpen, form]);

  const modalContent = (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm font-medium">Categories</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={
                selectedCategory === category.value ? "default" : "outline"
              }
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="h-8 text-xs"
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Popular Skills Section */}
      {selectedCategory === "all" && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-medium">Popular Skills</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSkills.map((skill) => (
              <Badge
                key={skill.id}
                variant={
                  watchedSkills.includes(skill.id) ? "default" : "outline"
                }
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleSkill(skill.id)}
              >
                <Star className="mr-1 h-3 w-3 fill-current" />
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Skills Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            All Skills{" "}
            {filteredSkills.length > 0 && `(${filteredSkills.length})`}
          </p>
          <p className="text-muted-foreground text-xs">
            Selected: {watchedSkills.length}/20
          </p>
        </div>

        <ScrollArea className="h-64">
          <div className="grid grid-cols-2 gap-2 pr-4">
            {filteredSkills.map((skill) => (
              <Button
                key={skill.id}
                variant={watchedSkills.includes(skill.id) ? "default" : "ghost"}
                size="sm"
                onClick={() => toggleSkill(skill.id)}
                className="h-auto justify-start p-3 text-left"
                disabled={
                  !watchedSkills.includes(skill.id) &&
                  watchedSkills.length >= 20
                }
              >
                <div className="flex items-center gap-2">
                  {skill.isPopular && (
                    <Star className="h-3 w-3 fill-current text-orange-500" />
                  )}
                  <span className="text-sm">{skill.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Skills Preview */}
      {watchedSkills.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Selected Skills</p>
          <div className="flex flex-wrap gap-2">
            {watchedSkills.map((skillId) => {
              const skill = SKILLS_CATALOG.find((s) => s.id === skillId);
              if (!skill) return null;

              return (
                <Badge
                  key={skillId}
                  variant="default"
                  className="group cursor-pointer"
                >
                  {skill.name}
                  <X
                    className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSkill(skillId);
                    }}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Errors */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="skills"
            render={() => (
              <FormItem>
                <FormControl>
                  <input type="hidden" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {allowSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip for now
              </Button>
            )}
            <Button
              type="submit"
              disabled={watchedSkills.length === 0 || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <>
                  <BookOpen className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Continue with ${watchedSkills.length} skill${watchedSkills.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  // Use Sheet on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">{modalContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
