import { NextResponse } from 'next/server';
import templates from '@/lib/templates.json';
export async function GET() {
  return NextResponse.json({
    success: true,
    templates: templates.map(({ code_html, ...t }) => t),
  });
}
