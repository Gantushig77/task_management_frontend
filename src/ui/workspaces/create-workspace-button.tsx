"use client";

import { useState } from "react";
import { HttpError } from "@/lib/api/client";
import { useCreateWorkspace } from "@/lib/api/hooks";
import { useToast } from "@/ui/toast/toast-provider";
import { WorkspaceDialog } from "@/ui/workspaces/workspace-dialog";

export function CreateWorkspaceButton({
  label = "+ Workspace",
  className,
  onCreated,
}: {
  label?: string;
  className?: string;
  onCreated?: (workspaceId: string) => void;
}) {
  const toast = useToast();
  const create = useCreateWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
      >
        {label}
      </button>

      <WorkspaceDialog
        title="Create workspace"
        confirmLabel="Create"
        isOpen={isOpen}
        isSubmitting={create.isPending}
        error={error}
        onClose={() => {
          if (create.isPending) return;
          setIsOpen(false);
        }}
        onConfirm={async (name) => {
          setError(null);
          try {
            const ws = await create.mutateAsync({ name });
            toast.show("Workspace created.");
            setIsOpen(false);
            onCreated?.(ws.id);
          } catch (e) {
            if (e instanceof HttpError) setError(e.message);
            else setError("Failed to create workspace.");
          }
        }}
      />
    </>
  );
}

