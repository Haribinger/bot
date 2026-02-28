import { auth } from '@harbinger-ai/harbinger/auth';
import { ChatPage } from '@harbinger-ai/harbinger/chat';

export default async function Home() {
  const session = await auth();
  return <ChatPage session={session} needsSetup={false} />;
}
