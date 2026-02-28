import { auth } from 'thepopebot/auth';
import { FindingsPage } from 'thepopebot/chat';

export default async function FindingsRoute() {
  const session = await auth();
  return <FindingsPage session={session} />;
}
