// Point this at your deployed Worker (or leave relative if Worker + Pages
// are served under the same domain via a route/proxy).
const API_BASE = 'https://artist-queue-api.YOUR-SUBDOMAIN.workers.dev';

const queueGrid = document.getElementById('queue-grid');
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTicket(card, index) {
  const el = document.createElement('article');
  el.className = 'ticket';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `View details for ${card.customerName}`);
  el.innerHTML = `
    <span class="ticket-stamp ${statusToClass(card.status)}">${escapeHtml(card.status || '')}</span>
    <div class="ticket-number">No. ${String(index + 1).padStart(3, '0')}</div>
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

async function loadQueue() {
  queueStatus.textContent = 'Loading queue…';
  try {
    const res = await fetch(`${API_BASE}/api/queue`);
    if (!res.ok) throw new Error('Failed to load queue');
    const cards = await res.json();
    queueGrid.innerHTML = '';
    if (cards.length === 0) {
      queueStatus.textContent = 'The queue is empty right now.';
      return;
    }
    queueStatus.textContent = '';
    cards.forEach((card, i) => queueGrid.appendChild(renderTicket(card, i)));
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
