import { auth } from '@harbinger-ai/harbinger/auth';
import { FindingsPage } from '@harbinger-ai/harbinger/chat';

export default async function FindingsRoute() {
  const session = await auth();
  return <FindingsPage session={session} />;
}
