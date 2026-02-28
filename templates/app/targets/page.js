import { auth } from 'thepopebot/auth';
import { TargetsPage } from 'thepopebot/chat';

export default async function TargetsRoute() {
  const session = await auth();
  return <TargetsPage session={session} />;
}
