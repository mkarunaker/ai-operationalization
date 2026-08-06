import { IdeaWorkspaceClient } from "./idea-workspace-client";

export default async function IdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  return <IdeaWorkspaceClient ideaId={ideaId} />;
}
