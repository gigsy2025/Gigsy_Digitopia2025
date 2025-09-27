"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  BudgetType,
  Currency,
  DifficultyLevel,
  ExperienceLevel,
  GigCategory,
} from "@/types/gigs";

export interface GigFilterState {
  search?: string;
  category?: GigCategory;
  difficultyLevel?: DifficultyLevel;
  experienceRequired?: ExperienceLevel;
  budgetType?: BudgetType;
  currency?: Currency;
  budgetMin?: number;
  budgetMax?: number;
  isRemoteOnly?: boolean;
  isUrgent?: boolean;
}

export interface GigFiltersProps {
  filters: GigFilterState;
  onChange: (nextFilters: GigFilterState) => void;
  onReset?: () => void;
  isBusy?: boolean;
  className?: string;
}

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

const experienceOptions: ExperienceLevel[] = [
  "entry",
  "intermediate",
  "senior",
  "expert",
];

const budgetTypeOptions: BudgetType[] = ["fixed", "hourly", "milestone"];
const currencyOptions: Currency[] = ["EGP", "USD", "EUR"];

export function GigFilters({
  filters,
  onChange,
  onReset,
  isBusy,
  className,
}: GigFiltersProps) {
  const budgetRange = useMemo<[number, number]>(() => {
    const min = typeof filters.budgetMin === "number" ? filters.budgetMin : 0;
    const max =
      typeof filters.budgetMax === "number" ? filters.budgetMax : 10000;
    if (min > max) {
      return [max, min];
    }
    return [min, max];
  }, [filters.budgetMin, filters.budgetMax]);

  const updateFilters = <K extends keyof GigFilterState>(
    key: K,
    value: GigFilterState[K],
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleBudgetMinChange = (value: string) => {
    const nextMin = Number(value);
    onChange({
      ...filters,
      budgetMin: Number.isNaN(nextMin) ? undefined : nextMin,
    });
  };

  const handleBudgetMaxChange = (value: string) => {
    const nextMax = Number(value);
    onChange({
      ...filters,
      budgetMax: Number.isNaN(nextMax) ? undefined : nextMax,
    });
  };

  const handleReset = () => {
    if (!onReset) {
      onChange({});
      return;
    }
    onReset();
  };

  return (
    <aside
      className={cn(
        "border-border bg-card rounded-lg border p-4 shadow-sm",
        "space-y-6",
        className,
      )}
      aria-label="Gig filters"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-base font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={isBusy}
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gig-search">Search</Label>
          <Input
            id="gig-search"
            placeholder="Search gigs or skills"
            value={filters.search ?? ""}
            onChange={(event) => updateFilters("search", event.target.value)}
            disabled={isBusy}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.category ?? undefined}
            onValueChange={(value: GigCategory) =>
              updateFilters("category", value)
            }
            disabled={isBusy}
          >
            <SelectTrigger id="gig-category">
              <SelectValue placeholder="All categories" />
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
        </div>

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select
            value={filters.difficultyLevel ?? undefined}
            onValueChange={(value: DifficultyLevel) =>
              updateFilters("difficultyLevel", value)
            }
            disabled={isBusy}
          >
            <SelectTrigger id="gig-difficulty">
              <SelectValue placeholder="All levels" />
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
        </div>

        <div className="space-y-2">
          <Label>Experience</Label>
          <Select
            value={filters.experienceRequired ?? undefined}
            onValueChange={(value: ExperienceLevel) =>
              updateFilters("experienceRequired", value)
            }
            disabled={isBusy}
          >
            <SelectTrigger id="gig-experience">
              <SelectValue placeholder="All experience levels" />
            </SelectTrigger>
            <SelectContent>
              {experienceOptions.map((experience) => (
                <SelectItem
                  key={experience}
                  value={experience}
                  className="capitalize"
                >
                  {experience}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm">Budget range</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="gig-budget-min"
                className="text-muted-foreground text-xs uppercase"
              >
                Min
              </Label>
              <Input
                id="gig-budget-min"
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                value={filters.budgetMin ?? ""}
                onChange={(event) => handleBudgetMinChange(event.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="gig-budget-max"
                className="text-muted-foreground text-xs uppercase"
              >
                Max
              </Label>
              <Input
                id="gig-budget-max"
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                value={filters.budgetMax ?? ""}
                onChange={(event) => handleBudgetMaxChange(event.target.value)}
                disabled={isBusy}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Showing gigs between {budgetRange[0]} and {budgetRange[1]}{" "}
            {filters.currency ?? "any currency"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Budget type</Label>
            <Select
              value={filters.budgetType ?? undefined}
              onValueChange={(value: BudgetType) =>
                updateFilters("budgetType", value)
              }
              disabled={isBusy}
            >
              <SelectTrigger id="gig-budget-type">
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                {budgetTypeOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="capitalize"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={filters.currency ?? undefined}
              onValueChange={(value: Currency) =>
                updateFilters("currency", value)
              }
              disabled={isBusy}
            >
              <SelectTrigger id="gig-currency">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((currency) => (
                  <SelectItem
                    key={currency}
                    value={currency}
                    className="uppercase"
                  >
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-border bg-muted/20 flex items-center justify-between rounded-md border border-dashed p-3">
          <div>
            <Label htmlFor="gig-remote-toggle" className="text-sm font-medium">
              Remote only
            </Label>
            <p className="text-muted-foreground text-xs">
              Only show gigs marked as remote
            </p>
          </div>
          <Switch
            id="gig-remote-toggle"
            checked={filters.isRemoteOnly ?? false}
            onCheckedChange={(checked) =>
              updateFilters("isRemoteOnly", checked)
            }
            disabled={isBusy}
            aria-label="Filter remote only gigs"
          />
        </div>

        <div className="border-border bg-muted/20 flex items-center justify-between rounded-md border border-dashed p-3">
          <div>
            <Label htmlFor="gig-urgent-toggle" className="text-sm font-medium">
              Urgent gigs
            </Label>
            <p className="text-muted-foreground text-xs">
              Prioritize gigs needing immediate attention
            </p>
          </div>
          <Switch
            id="gig-urgent-toggle"
            checked={filters.isUrgent ?? false}
            onCheckedChange={(checked) => updateFilters("isUrgent", checked)}
            disabled={isBusy}
            aria-label="Filter urgent gigs"
          />
        </div>
      </div>
    </aside>
  );
}
