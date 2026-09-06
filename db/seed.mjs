// Seed 100 template ke tabel web_templates (opsional; app sudah jalan dari lib/templates.json)
import { readFileSync } from 'node:fs';
import { sql } from '@vercel/postgres';
const rows = JSON.parse(readFileSync(new URL('../lib/templates.json', import.meta.url)));
console.log('Seeding', rows.length, 'templates…');
for (const t of rows) {
  await sql`INSERT INTO web_templates (id, template_name, category, is_premium, screenshot_url, code_html)
            VALUES (${t.id},${t.template_name},${t.category},${t.is_premium},${t.screenshot_url},${t.code_html})
            ON CONFLICT (id) DO UPDATE SET template_name=EXCLUDED.template_name, code_html=EXCLUDED.code_html`;
}
console.log('Selesai ✅');
