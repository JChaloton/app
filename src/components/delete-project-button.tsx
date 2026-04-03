"use client";

import { useActionState } from "react";
import { deleteProjectAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/lib/types";

const emptyDeleteState: ActionState<null> = {
  status: "idle",
  message: null,
  debug: null,
  data: null,
};

export function DeleteProjectButton({
  projectId,
  projectName,
  buildQuantity,
}: {
  projectId: number;
  projectName: string;
  buildQuantity: number;
}) {
  const [deleteState, deleteAction] = useActionState(deleteProjectAction, emptyDeleteState);

  return (
    <div className="space-y-2">
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Delete project "${projectName}"? This will restore the committed stock for ${buildQuantity} PCB(s) before removing the saved project.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <SubmitButton idleLabel="Delete" pendingLabel="Deleting..." />
      </form>
      <StatusBanner status={deleteState.status} message={deleteState.message} />
    </div>
  );
}
