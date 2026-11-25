import { colors } from './theme';

export const money = (n: number | null | undefined) =>
  `$${(Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export function date(value?: string | null, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '';
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, opts);
}

export function dateTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ago(value?: string | null) {
  if (!value) return '';
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date(value, { month: 'short', day: 'numeric' });
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function placingText(r: { placing?: number | null; award?: string | null } | null | undefined) {
  if (!r) return '';
  if (r.award) return r.award;
  return r.placing ? `${ordinal(Number(r.placing))} place` : 'Placed';
}

type Tone = { label: string; fg: string; bg: string };

const ENTRY: Record<string, Tone> = {
  cart: { label: 'In cart', fg: colors.amber, bg: colors.amberSoft },
  draft: { label: 'Draft', fg: colors.muted, bg: colors.bg },
  pending_payment: { label: 'Awaiting payment', fg: colors.amber, bg: colors.amberSoft },
  submitted: { label: 'Submitted', fg: colors.blue, bg: colors.blueSoft },
  under_review: { label: 'Under review', fg: colors.blue, bg: colors.blueSoft },
  approved: { label: 'Approved', fg: colors.green, bg: colors.greenSoft },
  needs_correction: { label: 'Needs a fix', fg: colors.red, bg: colors.redSoft },
  waitlisted: { label: 'Waitlisted', fg: colors.amber, bg: colors.amberSoft },
  checked_in: { label: 'Checked in', fg: colors.green, bg: colors.greenSoft },
  scratched: { label: 'Scratched', fg: colors.muted, bg: colors.bg },
  disqualified: { label: 'Disqualified', fg: colors.red, bg: colors.redSoft },
  completed: { label: 'Shown', fg: colors.navy, bg: colors.goldSoft },
  withdrawn: { label: 'Withdrawn', fg: colors.muted, bg: colors.bg },
  refunded: { label: 'Refunded', fg: colors.muted, bg: colors.bg },
};

export const entryTone = (status: string): Tone => ENTRY[status] || { label: status, fg: colors.muted, bg: colors.bg };

const WEIGHT: Record<string, Tone> = {
  not_weighed: { label: 'Needs weight', fg: colors.amber, bg: colors.amberSoft },
  submitted: { label: 'Weight submitted', fg: colors.blue, bg: colors.blueSoft },
  weighed: { label: 'Weighed', fg: colors.blue, bg: colors.blueSoft },
  verified: { label: 'Official', fg: colors.green, bg: colors.greenSoft },
  voided: { label: 'Not accepted', fg: colors.red, bg: colors.redSoft },
};

export const weightTone = (status: string): Tone => WEIGHT[status] || WEIGHT.not_weighed;

export const entryTitle = (e: { animal_name?: string | null; exhibitor_name?: string | null; entry_number?: string | number | null }) =>
  e.animal_name || e.exhibitor_name || (e.entry_number ? `Entry #${e.entry_number}` : 'Entry');
