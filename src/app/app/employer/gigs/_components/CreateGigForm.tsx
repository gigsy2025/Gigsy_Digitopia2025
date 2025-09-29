"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import { GigFormContainer } from "@/components/gigs/form/GigFormContainer";
import type { CreateGigInput } from "@/lib/validations/gigs";
import { api } from "convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";

interface CreateGigFormProps {
  employerId: string;
  returnPath: string;
}

export function CreateGigForm({ employerId, returnPath }: CreateGigFormProps) {
  const router = useRouter();
  const toast = useToast();
  const createGig = useMutation(api.employerGigs.createGig);

  const handleSubmit = useCallback(
    async (input: CreateGigInput) => {
      const { metadata, ...rest } = input;

      await createGig({
        input: {
          ...rest,
          ...(metadata
            ? {
                metadata: {
                  isUrgent: metadata.isUrgent,
                  isRemoteOnly: metadata.isRemoteOnly,
                  featuredUntil: metadata.featuredUntil,
                },
              }
            : {}),
        },
      });
      toast.success("Gig created");
      router.push(returnPath);
      router.refresh();
    },
    [createGig, returnPath, router, toast],
  );

  return (
    <GigFormContainer
      employerId={employerId}
      onSubmit={handleSubmit}
      className="max-w-4xl"
    />
  );
}
