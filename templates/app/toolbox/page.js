import { auth } from '@harbinger-ai/harbinger/auth';
import { RegistryPage } from '@harbinger-ai/harbinger/chat';

export default async function ToolboxRoute() {
  const session = await auth();
  return <RegistryPage session={session} />;
}
