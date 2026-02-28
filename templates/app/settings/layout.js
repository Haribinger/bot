import { auth } from '@harbinger-ai/harbinger/auth';
import { SettingsLayout } from '@harbinger-ai/harbinger/chat';

export default async function Layout({ children }) {
  const session = await auth();
  return <SettingsLayout session={session}>{children}</SettingsLayout>;
}
