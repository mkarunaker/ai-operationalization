import { redirect } from "next/navigation";

export default async function EditorialBoardPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  redirect(`/ideas/${ideaId}/board`);
}
