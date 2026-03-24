function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const RATING_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#9ca3af',
};

export function getMarkerColor(rating: string): string {
  return RATING_COLORS[rating] || RATING_COLORS.C;
}

export function buildPopupHTML(props: {
  id: string;
  name: string;
  account_rating: string;
  ytd_referrals: number;
  last_visit_date: string | null;
}): string {
  const ratingColor = getMarkerColor(props.account_rating);
  const safeName = escapeHtml(props.name);
  const safeRating = escapeHtml(props.account_rating);
  const safeId = encodeURIComponent(props.id);
  const lastVisit = props.last_visit_date
    ? new Date(props.last_visit_date).toLocaleDateString()
    : 'No visits';

  return `
    <div style="font-family:system-ui;min-width:180px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="background:${ratingColor};color:#fff;border-radius:9999px;padding:1px 8px;font-size:11px;font-weight:700">${safeRating}</span>
        <strong style="font-size:14px">${safeName}</strong>
      </div>
      <div style="font-size:12px;color:#666;line-height:1.6">
        <div>YTD Referrals: <b>${props.ytd_referrals}</b></div>
        <div>Last Visit: ${escapeHtml(lastVisit)}</div>
      </div>
      <a href="/organizations/${safeId}" style="display:inline-block;margin-top:8px;font-size:12px;color:#0d9488;font-weight:600;text-decoration:none">View Details →</a>
    </div>
  `;
}