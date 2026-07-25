// Point this at your deployed Worker (or leave relative if Worker + Pages
// are served under the same domain via a route/proxy).
const API_BASE = 'https://artist-queue-api.YOUR-SUBDOMAIN.workers.dev'.replace(/\/+$/, '');

const queueSections = document.getElementById('queue-sections');
const queueStatus = document.getElementById('queue-status');

const detailModal = document.getElementById('detail-modal');
const detailTitle = document.getElementById('detail-title');
const detailOrder = document.getElementById('detail-order');
const detailBody = document.getElementById('detail-body');

const formModal = document.getElementById('form-modal');
const openFormBtn = document.getElementById('open-form-btn');
const commissionForm = document.getElementById('commission-form');
const formStatus = document.getElementById('form-status');

function statusToClass(status) {
  return 'stamp-' + (status || '').toLowerCase().replace(/\s+/g, '-');
}

// Order matters — sections render top to bottom in this order.
// "collapsible" sections start closed; everything else always shows.
// The last section with statuses: null is a catch-all for anything not
// claimed by an earlier section (and not Inbox, which always gets its own
// section at the very bottom).
const SECTION_DEFS = [
  { title: 'In the Studio', statuses: ['Coloring', 'Doing Magic', 'Finished'], collapsible: false },
  { title: 'Sketching', statuses: ['Sketching'], collapsible: false },
  { title: 'Up Next', statuses: ['Up Next'], collapsible: false },
  { title: 'Entire Queue', statuses: null, collapsible: true },
  { title: 'Inbox', statuses: ['Inbox'], collapsible: false },
];

function groupCards(cards) {
  const claimed = new Set();
  SECTION_DEFS.filter((s) => s.statuses).forEach((s) => s.statuses.forEach((st) => claimed.add(st)));
  claimed.delete('Inbox'); // Inbox has its own dedicated section regardless

  return SECTION_DEFS.map((def) => {
    let sectionCards;
    if (def.title === 'Inbox') {
      sectionCards = cards.filter((c) => c.status === 'Inbox');
    } else if (def.statuses) {
      sectionCards = cards.filter((c) => def.statuses.includes(c.status));
    } else {
      // catch-all: everything not in another named section and not Inbox
      sectionCards = cards.filter((c) => c.status !== 'Inbox' && !claimed.has(c.status));
    }
    return { ...def, cards: sectionCards };
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTicket(card, number) {
  const el = document.createElement('article');
  el.className = 'ticket';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `View details for ${card.customerName}`);
  el.innerHTML = `
    <span class="ticket-stamp ${statusToClass(card.status)}">${escapeHtml(card.status || '')}</span>
    <div class="ticket-number">No. ${String(number).padStart(3, '0')}</div>
    <h3 class="ticket-name">${escapeHtml(card.customerName)}</h3>
    ${card.orderName ? `<p class="ticket-order">${escapeHtml(card.orderName)}</p>` : ''}
    ${card.notes ? `<p class="ticket-notes">${escapeHtml(card.notes)}</p>` : ''}
  `;
  const open = () => openDetail(card);
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  return el;
}

function renderSection(section, numberByCardId) {
  if (section.cards.length === 0) return null;

  const grid = document.createElement('div');
  grid.className = 'queue-grid';
  section.cards.forEach((card) => {
    grid.appendChild(renderTicket(card, numberByCardId.get(card.id) + 1));
  });

  if (section.collapsible) {
    const details = document.createElement('details');
    details.className = 'queue-section queue-section-collapsible';
    const summary = document.createElement('summary');
    summary.innerHTML = `<span class="section-title">${escapeHtml(section.title)}</span><span class="section-count">${section.cards.length}</span>`;
    details.appendChild(summary);
    details.appendChild(grid);
    return details;
  }

  const wrap = document.createElement('section');
  wrap.className = 'queue-section';
  wrap.innerHTML = `<h2 class="section-title">${escapeHtml(section.title)}<span class="section-count">${section.cards.length}</span></h2>`;
  wrap.appendChild(grid);
  return wrap;
}

async function loadQueue() {
  queueStatus.textContent = 'Loading queue…';
  try {
    const res = await fetch(`${API_BASE}/api/queue`);
    if (!res.ok) throw new Error('Failed to load queue');
    const cards = await res.json();
    queueSections.innerHTML = '';
    if (cards.length === 0) {
      queueStatus.textContent = 'The queue is empty right now.';
      return;
    }
    queueStatus.textContent = '';

    // Ticket numbers reflect overall queue position (creation order),
    // not position within whichever section they land in.
    const numberByCardId = new Map(cards.map((c, i) => [c.id, i]));
    groupCards(cards).forEach((section) => {
      const el = renderSection(section, numberByCardId);
      if (el) queueSections.appendChild(el);
    });
  } catch (err) {
    queueStatus.textContent = 'Could not load the queue. Please try again later.';
    console.error(err);
  }
}

async function openDetail(card) {
  detailTitle.textContent = card.customerName;
  detailOrder.textContent = card.orderName || '';
  detailBody.innerHTML = '<p>Loading…</p>';
  showModal(detailModal);

  try {
    const res = await fetch(`${API_BASE}/api/queue/${card.id}`);
    if (!res.ok) throw new Error('Failed to load details');
    const data = await res.json();
    renderDescription(data.description);
  } catch (err) {
    detailBody.innerHTML = '<p>Could not load details for this item.</p>';
    console.error(err);
  }
}

function renderDescription(blocks) {
  if (!blocks || blocks.length === 0) {
    detailBody.innerHTML = '<p><em>No description yet.</em></p>';
    return;
  }
  detailBody.innerHTML = blocks.map((block) => {
    if (block.type === 'paragraph') return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === 'heading') return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === 'list_item') return `<p>• ${escapeHtml(block.text)}</p>`;
    if (block.type === 'image') {
      const caption = block.caption ? `<div class="img-caption">${escapeHtml(block.caption)}</div>` : '';
      return `<img src="${block.url}" alt="${escapeHtml(block.caption || 'Reference image')}" loading="lazy" />${caption}`;
    }
    return '';
  }).join('');
}

function showModal(modal) {
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal')));
});

[detailModal, formModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal(modal);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    [detailModal, formModal].forEach((m) => { if (!m.classList.contains('hidden')) hideModal(m); });
  }
});

openFormBtn.addEventListener('click', () => showModal(formModal));

commissionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formStatus.textContent = 'Submitting…';
  const formData = new FormData(commissionForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${API_BASE}/api/commission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Submission failed');
    formStatus.textContent = 'Request received! You have been added to the queue.';
    commissionForm.reset();
    setTimeout(() => {
      hideModal(formModal);
      formStatus.textContent = '';
      loadQueue();
    }, 1500);
  } catch (err) {
    formStatus.textContent = 'Something went wrong — please try again.';
    console.error(err);
  }
});

loadQueue();
