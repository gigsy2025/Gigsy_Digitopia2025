"use client";

import { useFormContext } from "react-hook-form";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  GIG_EDITOR_BUDGET_TYPES,
  GIG_EDITOR_CURRENCIES,
  GIG_EDITOR_DURATION_UNITS,
  type GigEditorFormValues,
} from "@/lib/validations/gigEditor";

export function GigBudgetTimelineSection() {
  const form = useFormContext<GigEditorFormValues>();

  return (
    <section className="border-border rounded-2xl border p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Budget &amp; timeline</h2>
        <p className="text-muted-foreground text-sm">
          Keep budgets accurate to set expectations with candidates.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="budgetMin"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Minimum budget</Label>
              <FormControl>
                <Input type="number" min={0} step={50} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budgetMax"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Maximum budget</Label>
              <FormControl>
                <Input type="number" min={0} step={50} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budgetCurrency"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Currency</Label>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GIG_EDITOR_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
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
          name="budgetType"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Budget type</Label>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GIG_EDITOR_BUDGET_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
          name="applicationDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <Label>Application deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        new Date(field.value).toLocaleDateString()
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString().slice(0, 10) : "")}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Leave empty for rolling applications.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <Label>Project deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        new Date(field.value).toLocaleDateString()
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString().slice(0, 10) : "")}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedDurationValue"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Estimated duration</Label>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input type="number" min={1} max={365} placeholder="e.g. 6" {...field} />
                </FormControl>
                <FormField
                  control={form.control}
                  name="estimatedDurationUnit"
                  render={({ field: unitField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Select onValueChange={unitField.onChange} value={unitField.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {GIG_EDITOR_DURATION_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
