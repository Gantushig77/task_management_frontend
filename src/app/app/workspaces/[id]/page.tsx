"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HttpError } from "@/lib/api/client";
import {
  DEFAULT_PAGE_LIMIT,
  useDeleteBoard,
  useDeleteWorkspace,
  useInfiniteBoards,
  useInfiniteWorkspaceMembers,
  useUpdateBoard,
  useUpdateWorkspace,
  useWorkspace,
} from "@/lib/api/hooks";
import type { WorkspaceMember } from "@/lib/api/types";
import { useToast } from "@/ui/toast/toast-provider";
import { WorkspaceDialog } from "@/ui/workspaces/workspace-dialog";
import { WorkspaceMembersDialog } from "@/ui/workspaces/workspace-members-dialog";
import { CreateBoardButton } from "@/ui/boards/create-board-button";

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = params.id;
  const workspaceQuery = useWorkspace(id);
  const update = useUpdateWorkspace();
  const del = useDeleteWorkspace();
  const boardsQuery = useInfiniteBoards(id, DEFAULT_PAGE_LIMIT);
  const membersQuery = useInfiniteWorkspaceMembers(id, DEFAULT_PAGE_LIMIT);
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [boardEditId, setBoardEditId] = useState<string | null>(null);
  const [boardEditName, setBoardEditName] = useState<string>("");
  const [boardEditError, setBoardEditError] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const ws = workspaceQuery.data;
  const title = useMemo(() => ws?.name ?? "Workspace", [ws?.name]);
  const boards = useMemo(
    () => boardsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [boardsQuery.data],
  );
  const members = useMemo(
    () => membersQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [membersQuery.data],
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-black/4 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
              onClick={() => setIsMembersOpen(true)}
            >
              Members
            </button>
            <button
              type="button"
              className="h-9 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-black/4 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
              disabled={workspaceQuery.isLoading || !ws}
              onClick={() => {
                setEditError(null);
                setIsEditOpen(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="h-9 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-700 hover:bg-red-500/15 disabled:opacity-60 dark:text-red-300"
              disabled={del.isPending}
              onClick={async () => {
                setDeleteError(null);
                const ok = window.confirm("Delete this workspace? This cannot be undone.");
                if (!ok) return;
                try {
                  await del.mutateAsync({ id });
                  toast.show("Workspace deleted.");
                  router.push("/app");
                } catch (e) {
                  if (e instanceof HttpError) setDeleteError(e.message);
                  else setDeleteError("Failed to delete workspace.");
                }
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </button>
            <Link
              href="/app"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium leading-none hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
            >
              Back
            </Link>
          </div>
        </div>

        {workspaceQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            Failed to load workspace.
          </div>
        ) : null}

        {deleteError ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {deleteError}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Boards</div>
            <CreateBoardButton
              workspaceId={id}
              className="h-9 rounded-xl bg-black px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            />
          </div>

          {boardsQuery.isError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              Failed to load boards.
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {boards.map((b: { id: string; name: string }) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-zinc-950"
              >
                <Link href={`/app/boards/${b.id}`} className="min-w-0 flex-1 hover:underline">
                  <div className="truncate font-medium">{b.name}</div>
                  <div className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {b.id}
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="h-8 rounded-lg px-3 text-xs font-medium hover:bg-black/4 dark:hover:bg-white/6"
                    onClick={() => {
                      setBoardEditError(null);
                      setBoardEditId(b.id);
                      setBoardEditName(b.name);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="h-8 rounded-lg px-3 text-xs font-medium text-red-700 hover:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                    onClick={async () => {
                      const ok = window.confirm("Delete this board?");
                      if (!ok) return;
                      try {
                        await deleteBoard.mutateAsync({ id: b.id, workspaceId: id });
                        toast.show("Board deleted.");
                      } catch (e) {
                        toast.show(e instanceof HttpError ? e.message : "Failed to delete board.");
                      }
                    }}
                    disabled={deleteBoard.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {boardsQuery.hasNextPage ? (
              <button
                type="button"
                className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium hover:bg-black/4 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
                onClick={() => boardsQuery.fetchNextPage()}
                disabled={boardsQuery.isFetchingNextPage}
              >
                {boardsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            ) : null}

            {!boardsQuery.isLoading && boards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 px-3 py-8 text-center text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
                No boards yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <WorkspaceDialog
        title="Rename board"
        confirmLabel="Save"
        isOpen={!!boardEditId}
        initialName={boardEditName}
        isSubmitting={updateBoard.isPending}
        error={boardEditError}
        onClose={() => {
          if (updateBoard.isPending) return;
          setBoardEditId(null);
        }}
        onConfirm={async (name) => {
          if (!boardEditId) return;
          setBoardEditError(null);
          try {
            await updateBoard.mutateAsync({ id: boardEditId, workspaceId: id, name });
            toast.show("Board updated.");
            setBoardEditId(null);
          } catch (e) {
            if (e instanceof HttpError) setBoardEditError(e.message);
            else setBoardEditError("Failed to update board.");
          }
        }}
      />

      <WorkspaceMembersDialog
        isOpen={isMembersOpen}
        isLoading={membersQuery.isLoading}
        isError={membersQuery.isError}
        workspaceId={id}
        members={members as WorkspaceMember[]}
        loadedCountLabel={`${members.length} loaded`}
        hasNextPage={!!membersQuery.hasNextPage}
        isFetchingNextPage={membersQuery.isFetchingNextPage}
        onClose={() => setIsMembersOpen(false)}
        onLoadMore={() => membersQuery.fetchNextPage()}
      />

      <WorkspaceDialog
        title="Rename workspace"
        confirmLabel="Save"
        isOpen={isEditOpen}
        initialName={ws?.name ?? ""}
        isSubmitting={update.isPending}
        error={editError}
        onClose={() => {
          if (update.isPending) return;
          setIsEditOpen(false);
        }}
        onConfirm={async (name) => {
          setEditError(null);
          try {
            await update.mutateAsync({ id, name });
            toast.show("Workspace updated.");
            setIsEditOpen(false);
          } catch (e) {
            if (e instanceof HttpError) setEditError(e.message);
            else setEditError("Failed to update workspace.");
          }
        }}
      />
    </div>
  );
}

