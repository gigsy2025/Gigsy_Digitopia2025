"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateGigInput } from "@/lib/validations/gigs";
import type { BudgetType, Currency } from "@/types/gigs";
import { cn } from "@/lib/utils";

const currencyOptions: Currency[] = ["EGP", "USD", "EUR"];
const budgetTypeOptions: BudgetType[] = ["fixed", "hourly", "milestone"];

function toDateTimeInputValue(timestamp?: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function GigFormStepBudget({ className }: { className?: string }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateGigInput>();

  const deadline = watch("deadline");
  const applicationDeadline = watch("applicationDeadline");
  const selectedCurrency = watch("budget.currency");
  const selectedBudgetType = watch("budget.type");

  return (
    <div className={cn("grid gap-6", className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="gig-budget-min">Minimum budget</Label>
          <Input
            id="gig-budget-min"
            type="number"
            min={0}
            step={50}
            placeholder="500"
            {...register("budget.min", { valueAsNumber: true })}
          />
          {errors.budget?.min ? (
            <p className="text-destructive text-sm">
              {errors.budget.min.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gig-budget-max">Maximum budget</Label>
          <Input
            id="gig-budget-max"
            type="number"
            min={0}
            step={50}
            placeholder="1500"
            {...register("budget.max", { valueAsNumber: true })}
          />
          {errors.budget?.max ? (
            <p className="text-destructive text-sm">
              {errors.budget.max.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="gig-budget-currency">Currency</Label>
          <Select
            value={selectedCurrency}
            onValueChange={(value: Currency) =>
              setValue("budget.currency", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="gig-budget-currency">
              <SelectValue placeholder="Select currency" />
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
          {errors.budget?.currency ? (
            <p className="text-destructive text-sm">
              {errors.budget.currency.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gig-budget-type">Budget type</Label>
          <Select
            value={selectedBudgetType}
            onValueChange={(value: BudgetType) =>
              setValue("budget.type", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="gig-budget-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {budgetTypeOptions.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.budget?.type ? (
            <p className="text-destructive text-sm">
              {errors.budget.type.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="gig-deadline">Project deadline (optional)</Label>
          <Input
            id="gig-deadline"
            type="datetime-local"
            value={toDateTimeInputValue(deadline)}
            onChange={(event) => {
              const value = event.target.value;
              setValue(
                "deadline",
                value ? new Date(value).getTime() : undefined,
                {
                  shouldValidate: true,
                  shouldDirty: true,
                },
              );
            }}
          />
          {errors.deadline ? (
            <p className="text-destructive text-sm">
              {errors.deadline.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gig-application-deadline">
            Application deadline (optional)
          </Label>
          <Input
            id="gig-application-deadline"
            type="datetime-local"
            value={toDateTimeInputValue(applicationDeadline)}
            onChange={(event) => {
              const value = event.target.value;
              setValue(
                "applicationDeadline",
                value ? new Date(value).getTime() : undefined,
                {
                  shouldValidate: true,
                  shouldDirty: true,
                },
              );
            }}
          />
          {errors.applicationDeadline ? (
            <p className="text-destructive text-sm">
              {errors.applicationDeadline.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
