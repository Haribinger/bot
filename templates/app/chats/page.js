import { auth } from '@harbinger-ai/harbinger/auth';
import { ChatsPage } from '@harbinger-ai/harbinger/chat';

export default async function ChatsRoute() {
  const session = await auth();
  return <ChatsPage session={session} />;
}
