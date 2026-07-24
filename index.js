/**
 * Artist Queue — Cloudflare Worker
 * ---------------------------------
 * Backs a public commission queue with a Notion database.
 *
 * Routes:
 *   GET  /api/queue          -> list of public queue cards (no description body)
 *   GET  /api/queue/:id      -> full detail for one card (text + image blocks)
 *   POST /api/commission     -> create a new Notion page with Status = Inbox
 *
 * Required environment (set via `wrangler secret put` or the dashboard):
 *   NOTION_TOKEN        - Notion internal integration secret
 *   NOTION_DATABASE_ID  - the database ID the queue lives in
 *   ALLOWED_ORIGIN       - (optional) origin allowed for CORS, e.g. https://queue.yoursite.com
 *                          defaults to "*" if unset
 *
 * Notion database property names this code expects (edit PROPS below to match yours):
 *   Customer Name  -> title
 *   Order Name     -> rich_text
 *   Notes          -> rich_text
 *   Status         -> select   (needs an "Inbox" option, plus whatever else you use)
 *
 * "Description" is NOT a database property — it's the page body itself (blocks).
 * You add paragraphs + images directly on the Notion page; the worker reads
 * those blocks back out for the public detail view. The commission form only
 * writes text (title + rich text properties + one opening paragraph block);
 * you add images afterward inside Notion.
 */

const NOTION_VERSION = '2022-06-28';

// Edit these to match your actual Notion property names exactly.
const PROPS = {
  customerName: 'Customer Name',
  orderName: 'Order Name',
  notes: 'Notes',
  status: 'Status',
};

// Statuses that should NOT appear on the public queue.
const HIDDEN_STATUSES = new Set(['Archived', 'Declined']);

const DEFAULT_STATUS = 'Inbox';

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
      ...extraHeaders,
    },
  });
}

function notionHeaders(env) {
  return {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

function plainText(richTextArray) {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((t) => t.plain_text || '').join('');
}

function getTitle(page) {
  const prop = page.properties?.[PROPS.customerName];
  if (!prop || prop.type !== 'title') return '';
  return plainText(prop.title);
}

function getRichText(page, key) {
  const prop = page.properties?.[key];
  if (!prop || prop.type !== 'rich_text') return '';
  return plainText(prop.rich_text);
}

function getStatus(page) {
  const prop = page.properties?.[PROPS.status];
  if (!prop || prop.type !== 'select' || !prop.select) return '';
  return prop.select.name;
}

function cardFromPage(page) {
  return {
    id: page.id,
    customerName: getTitle(page),
    orderName: getRichText(page, PROPS.orderName),
    notes: getRichText(page, PROPS.notes),
    status: getStatus(page),
    createdTime: page.created_time,
  };
}

/** Turn Notion block children into a simple [{type:'paragraph',text} | {type:'image',url,caption}] list */
function blocksToDescription(blocks) {
  const out = [];
  for (const block of blocks) {
    if (block.type === 'paragraph') {
      const text = plainText(block.paragraph.rich_text);
      if (text.trim().length > 0) out.push({ type: 'paragraph', text });
    } else if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const text = plainText(block[block.type].rich_text);
      if (text.trim().length > 0) out.push({ type: 'heading', text });
    } else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const text = plainText(block[block.type].rich_text);
      if (text.trim().length > 0) out.push({ type: 'list_item', text });
    } else if (block.type === 'image') {
      const img = block.image;
      const url = img.type === 'external' ? img.external.url : img.file.url;
      const caption = plainText(img.caption);
      out.push({ type: 'image', url, caption });
    }
  }
  return out;
}

async function fetchQueue(env) {
  const res = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify({
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      page_size: 100,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion query failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  return data.results
    .map(cardFromPage)
    .filter((card) => !HIDDEN_STATUSES.has(card.status));
}

async function fetchDescription(env, pageId) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: notionHeaders(env),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion blocks fetch failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  return blocksToDescription(data.results);
}

async function createCommission(env, body) {
  const { customerName, orderName, requestDetails } = body;

  if (!customerName || !customerName.trim()) {
    throw new Error('customerName is required');
  }

  const children = [];
  if (requestDetails && requestDetails.trim()) {
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: requestDetails.trim() } }],
      },
    });
  }

  const payload = {
    parent: { database_id: env.NOTION_DATABASE_ID },
    properties: {
      [PROPS.customerName]: {
        title: [{ type: 'text', text: { content: customerName.trim() } }],
      },
      [PROPS.orderName]: {
        rich_text: orderName
          ? [{ type: 'text', text: { content: orderName.trim() } }]
          : [],
      },
      [PROPS.status]: {
        select: { name: DEFAULT_STATUS },
      },
    },
    children,
  };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion page create failed: ${res.status} ${errText}`);
  }
  return res.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      if (pathname === '/api/queue' && request.method === 'GET') {
        const cards = await fetchQueue(env);
        return json(cards, 200, env, { 'Cache-Control': 'public, max-age=15' });
      }

      const detailMatch = pathname.match(/^\/api\/queue\/([a-zA-Z0-9-]+)$/);
      if (detailMatch && request.method === 'GET') {
        const pageId = detailMatch[1];
        const description = await fetchDescription(env, pageId);
        // Notion file-hosted image URLs expire ~1hr after issue, so keep this uncached.
        return json({ id: pageId, description }, 200, env, { 'Cache-Control': 'no-store' });
      }

      if (pathname === '/api/commission' && request.method === 'POST') {
        // Simple honeypot spam check: if the hidden field is filled, silently "succeed".
        const body = await request.json();
        if (body.website) {
          return json({ ok: true }, 200, env);
        }
        const page = await createCommission(env, body);
        return json({ ok: true, id: page.id }, 201, env);
      }

      return json({ error: 'Not found' }, 404, env);
    } catch (err) {
      return json({ error: err.message || 'Unexpected error' }, 500, env);
    }
  },
};
