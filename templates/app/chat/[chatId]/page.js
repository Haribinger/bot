import { auth } from '@harbinger-ai/harbinger/auth';
import { ChatPage } from '@harbinger-ai/harbinger/chat';

export default async function ChatRoute({ params }) {
  const { chatId } = await params;
  const session = await auth();
  return <ChatPage session={session} needsSetup={false} chatId={chatId} />;
}
