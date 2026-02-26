// BamboojamVilla OS — Notion helpers
import { getNotionToken } from './config';

const NOTION_VERSION = '2022-06-28';

export async function notionRequest(path, method = 'GET', body = null) {
  const token = getNotionToken();
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion ${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

export async function queryDB(dbId, filter = null, sorts = null, { maxRows = 2000 } = {}) {
  if (!dbId) return [];
  const body = {};
  if (filter) body.filter = filter;
  if (sorts)  body.sorts  = sorts;
  body.page_size = 100;

  let all    = [];
  let cursor = undefined;
  do {
    if (cursor) body.start_cursor = cursor;
    const data = await notionRequest(`/databases/${dbId}/query`, 'POST', body);
    all    = all.concat(data.results || []);
    cursor = data.has_more ? data.next_cursor : undefined;
    if (all.length >= maxRows) { cursor = undefined; break; }
  } while (cursor);

  return all;
}

export async function createPage(dbId, properties) {
  return notionRequest('/pages', 'POST', {
    parent: { database_id: dbId },
    properties,
  });
}

// Property readers
export const getTitle   = (p) => p?.properties?.Description?.title?.[0]?.plain_text
                               || p?.properties?.['Period Name']?.title?.[0]?.plain_text
                               || 'Untitled';
export const getNumber  = (p, key) => p?.properties?.[key]?.number ?? null;
export const getSelect  = (p, key) => p?.properties?.[key]?.select?.name ?? null;
export const getDate    = (p, key) => p?.properties?.[key]?.date?.start ?? null;
export const getText    = (p, key) => p?.properties?.[key]?.rich_text?.[0]?.plain_text ?? '';
export const getFormula = (p, key) => p?.properties?.[key]?.formula?.number ?? null;
