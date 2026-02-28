import { auth } from '@harbinger-ai/harbinger/auth';
import { SwarmPage } from '@harbinger-ai/harbinger/chat';

export default async function SwarmRoute() {
  const session = await auth();
  return <SwarmPage session={session} />;
}
