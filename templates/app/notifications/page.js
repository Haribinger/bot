import { auth } from '@harbinger-ai/harbinger/auth';
import { NotificationsPage } from '@harbinger-ai/harbinger/chat';

export default async function NotificationsRoute() {
  const session = await auth();
  return <NotificationsPage session={session} />;
}
