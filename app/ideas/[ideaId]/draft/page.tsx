import { IdeaWorkspaceClient } from "../idea-workspace-client";

export default async function DraftPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  return <IdeaWorkspaceClient ideaId={ideaId} mode="draft" />;
}
