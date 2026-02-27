import { NextResponse } from 'next/server';
import { getDB, getNotionToken } from '@/lib/config';

const BASE = 'https://api.notion.com/v1';

async function notionPost(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return data;
}

export async function POST(req) {
  try {
    const token = getNotionToken();
    if (!token) return NextResponse.json({ error: 'No Notion token' }, { status: 500 });

    const body = await req.json();
    const { type } = body;

    if (type === 'revenue') {
      const { description, amount, date, period, notes } = body;
      if (!description || !amount || !date) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

      const props = {
        'Description': { title: [{ text: { content: description } }] },
        'Amount':      { number: parseFloat(amount) },
        'Date':        { date: { start: date } },
        'Period':      { select: { name: period || String(new Date(date).getFullYear()) } },
      };
      if (notes) props['Notes'] = { rich_text: [{ text: { content: notes } }] };

      const page = await notionPost('/pages', {
        parent: { database_id: getDB('revenues') },
        properties: props,
      }, token);
      return NextResponse.json({ ok: true, id: page.id });
    }

    if (type === 'expense') {
      const { description, total, date, period, source, category, notes } = body;
      if (!description || !total || !date) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

      const props = {
        'Description': { title: [{ text: { content: description } }] },
        'Total':       { number: parseFloat(total) },
        'Date':        { date: { start: date } },
        'Period':      { select: { name: period || String(new Date(date).getFullYear()) } },
      };
      if (source)   props['Source']   = { select: { name: source } };
      if (category) props['Category'] = { select: { name: category } };
      if (notes)    props['Notes']    = { rich_text: [{ text: { content: notes } }] };

      const page = await notionPost('/pages', {
        parent: { database_id: getDB('expenses') },
        properties: props,
      }, token);
      return NextResponse.json({ ok: true, id: page.id });
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
