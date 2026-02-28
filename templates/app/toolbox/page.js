import { auth } from 'thepopebot/auth';
import { RegistryPage } from 'thepopebot/chat';

export default async function ToolboxRoute() {
  const session = await auth();
  return <RegistryPage session={session} />;
}
