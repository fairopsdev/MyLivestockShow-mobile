// Same rules as the website (src/lib/entryVisibility.js in Fair Central):
// a division hidden from the entry form hides its sub-divisions and classes,
// and classes with their own hide flag are dropped too.

type Division = { id: string; hide_from_entry?: boolean; parent_division_id?: string | null; [k: string]: any };
type ShowClass = { id: string; division_id?: string; hide_from_entry_form?: boolean; birth_date_from?: string; birth_date_to?: string; [k: string]: any };

export function hiddenDivisionIds(divisions: Division[] = []) {
  const byId = new Map(divisions.map((d) => [d.id, d]));
  const hidden = new Set<string>();
  const isHidden = (div: Division | undefined, seen = new Set<string>()): boolean => {
    if (!div || seen.has(div.id)) return false;
    if (div.hide_from_entry === true) return true;
    if (!div.parent_division_id) return false;
    seen.add(div.id);
    return isHidden(byId.get(div.parent_division_id), seen);
  };
  for (const div of divisions) if (isHidden(div)) hidden.add(div.id);
  return hidden;
}

export function entryCatalog(divisions: Division[] = [], classes: ShowClass[] = []) {
  const hidden = hiddenDivisionIds(divisions);
  return {
    divisions: divisions.filter((d) => !hidden.has(d.id)),
    classes: classes.filter((c) => c.hide_from_entry_form !== true && !hidden.has(c.division_id || '')),
  };
}

// Birth-date divisions: the class comes from the animal's birth date, the
// narrowest matching range first.
export function classForBirthDate(classes: ShowClass[] = [], divisionId: string, birthDate?: string | null) {
  const bd = String(birthDate || '').slice(0, 10);
  if (!bd) return null;
  const day = (s?: string) => new Date(`${String(s).slice(0, 10)}T00:00:00Z`).getTime();
  const matches = classes.filter((c) => c.division_id === divisionId && c.birth_date_from && c.birth_date_to
    && bd >= String(c.birth_date_from).slice(0, 10) && bd <= String(c.birth_date_to).slice(0, 10));
  matches.sort((a, b) => (day(a.birth_date_to) - day(a.birth_date_from)) - (day(b.birth_date_to) - day(b.birth_date_from)));
  return matches[0] || null;
}
