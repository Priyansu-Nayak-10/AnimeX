import { createApiClient } from '../../core/services.js';
import { timeAgo } from '../../utils/formatters.js';

const apiClient = createApiClient();

export async function initLiveActivity(socket) {
  const feedContainer = document.getElementById('live-activity-feed');
  if (!feedContainer) return;

  // 1. Fetch initial activity array on page load
  try {
    const res = await apiClient.get('/users/community/activity');
    if (res?.data?.success) {
      const activities = res.data.data;
      feedContainer.innerHTML = ''; // clear loading text

      if (activities.length === 0) {
        feedContainer.innerHTML = `<div style="text-align:center;color:#666;font-size:0.85rem;padding:20px;">Network quiet. Start watching!</div>`;
      } else {
        activities.forEach(act => prependActivityUI(act, feedContainer, false));
      }
    }
  } catch (err) {
    console.error('[Live Activity] Failed to fetch initial state', err);
    feedContainer.innerHTML = `<div style="text-align:center;color:#f87171;font-size:0.85rem;padding:20px;">Failed to connect to network</div>`;
  }

  // 2. Listen for real-time WebSocket events from other people globally
  if (socket) {
    socket.on('live_activity', (act) => {
      // Remove placeholder if present
      const emptyMsg = feedContainer.querySelector('div[style*="text-align:center"]');
      if (emptyMsg) emptyMsg.remove();
      
      prependActivityUI(act, feedContainer, true);
    });
  }
}

function prependActivityUI(activity, container, animate) {
  let parsedPayload;
  try {
    parsedPayload = JSON.parse(activity.payload);
  } catch {
    parsedPayload = {};
  }

  const { title, image } = parsedPayload;
  const avatar = activity.user.avatar || '/images/default_avatar.png';
  const name = activity.user.name || 'Anonymous';
  const actionColor = activity.action.includes('completed') ? 'var(--accent-color)' : '#10b981';

  const div = document.createElement('div');
  div.className = `live-activity-item ${animate ? 'animate-slide-down' : ''}`;
  div.innerHTML = `
    <img src="${avatar}" class="activity-avatar" alt="avatar" onerror="this.src='/images/default_avatar.png'" />
    <div class="activity-content">
      <div class="activity-top">
        <span class="activity-user">${name}</span>
        <span class="activity-time">${timeAgo(new Date(activity.timestamp))}</span>
      </div>
      <div class="activity-action" style="color: ${actionColor};">
        ${activity.action} <span style="font-weight: 500; color: var(--text-gray-100);">"${title || 'an anime'}"</span>
      </div>
    </div>
    ${image ? `<img src="${image}" class="activity-poster" alt="poster" />` : ''}
  `;

  container.prepend(div);

  // Keep max limit in UI
  if (container.children.length > 20) {
    container.lastElementChild.remove();
  }
}
