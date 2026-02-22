// Notion proxy API — used by CLI to create/query pages
import { notionRequest } from '@/lib/notion';

export async function POST(req) {
  try {
    const { path, method, body } = await req.json();
    const result = await notionRequest(path, method || 'POST', body);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
