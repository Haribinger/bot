import { auth } from '@harbinger-ai/harbinger/auth';
import { TargetsPage } from '@harbinger-ai/harbinger/chat';

export default async function TargetsRoute() {
  const session = await auth();
  return <TargetsPage session={session} />;
}
