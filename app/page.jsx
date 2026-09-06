import Landing from '@/components/ui/Landing';
import { getChangelogs, getLatestVersion } from '@/lib/db';
import templates from '@/lib/templates.json';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const changelogs = await getChangelogs().catch(() => []);
  const version = await getLatestVersion().catch(() => '1.0.0');
  const list = templates.slice(0, 8).map(({ code_html, ...t }) => t);
  return <Landing changelogs={JSON.parse(JSON.stringify(changelogs))} templates={list} version={version} />;
}
