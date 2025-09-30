import { useCallback, useState } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";

import { toast } from "sonner";

export interface GigSkillManagerOptions<
  TFormValues extends FieldValues & { skills: string[] },
> {
  form: UseFormReturn<TFormValues>;
  maxSkills?: number;
  pendingSkillInitialValue?: string;
}

export interface GigSkillManagerResult {
  pendingSkill: string;
  setPendingSkill: (value: string) => void;
  handleAddSkill: () => void;
  handleRemoveSkill: (skill: string) => void;
}

export function useGigSkillManager<
  TFormValues extends FieldValues & { skills: string[] },
>(
  options: GigSkillManagerOptions<TFormValues>,
): GigSkillManagerResult {
  const { form, maxSkills = 15, pendingSkillInitialValue = "" } = options;
  const [pendingSkill, setPendingSkill] = useState(pendingSkillInitialValue);

  const skillsPath = "skills" as Path<TFormValues>;
  const skills = (form.watch(skillsPath) ?? []) as TFormValues["skills"];

  const handleAddSkill = useCallback(() => {
    const value = pendingSkill.trim();
    if (!value) {
      return;
    }

    if (skills.includes(value)) {
      toast.info("Skill already added");
      return;
    }

    if (skills.length >= maxSkills) {
      toast.warning(`Maximum of ${maxSkills} skills reached`);
      return;
    }

    const updatedSkills = [...skills, value] as PathValue<
      TFormValues,
      typeof skillsPath
    >;

    form.setValue(skillsPath, updatedSkills, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setPendingSkill("");
  }, [form, maxSkills, pendingSkill, skills]);

  const handleRemoveSkill = useCallback(
    (skill: string) => {
      const updatedSkills = skills.filter((item) => item !== skill) as PathValue<
        TFormValues,
        typeof skillsPath
      >;

      form.setValue(skillsPath, updatedSkills, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form, skills],
  );

  return {
    pendingSkill,
    setPendingSkill,
    handleAddSkill,
    handleRemoveSkill,
  };
}
