"use client";

import { useState } from "react";
import { HttpError } from "@/lib/api/client";
import { useCreateBoard } from "@/lib/api/hooks";
import { useToast } from "@/ui/toast/toast-provider";
import { WorkspaceDialog } from "@/ui/workspaces/workspace-dialog";

export function CreateBoardButton({
  workspaceId,
  label = "+ Board",
  className,
}: {
  workspaceId: string;
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const create = useCreateBoard();
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
        disabled={!workspaceId}
      >
        {label}
      </button>

      <WorkspaceDialog
        title="Create board"
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
            await create.mutateAsync({ workspaceId, name });
            toast.show("Board created.");
            setIsOpen(false);
          } catch (e) {
            if (e instanceof HttpError) setError(e.message);
            else setError("Failed to create board.");
          }
        }}
      />
    </>
  );
}

