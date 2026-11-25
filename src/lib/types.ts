export type Fair = { id: string; slug: string; name: string; address?: string };

export type Result = {
  id: string; organization_id: string; show_id: string | null; class_id: string | null; entry_id: string | null;
  exhibitor_id: string | null; placing: number | null; award: string | null; premium: number | null;
  points: number | null; is_champion: boolean | null; champion_type: string | null; comments: string | null;
  class_name?: string; department_name?: string; exhibitor_name?: string; animal_name?: string;
};

export type Entry = {
  id: string; organization_id: string; show_id: string; class_id: string | null; department_id: string | null;
  exhibitor_id: string | null; entry_number: string | number | null; confirmation_number: string | null;
  status: string; total_fee: number | null; entry_fee: number | null; is_late: boolean | null;
  show_name: string | null; department_name: string | null; division_name: string | null; class_name: string | null;
  exhibitor_name: string | null; animal_name: string | null; admin_notes: string | null; order_id: string | null;
  late_fee: number | null; weight: number | null; weight_status: string | null; check_in_date: string | null;
  created_date: string;
  payment?: { status: string; method: string; order_number: string; total: number; amount_paid: number } | null;
  result?: Result | null;
};

export type Show = {
  id: string; organization_id: string; name: string; description?: string; location_name?: string;
  start_date?: string; end_date?: string; entry_open_date?: string; entry_close_date?: string;
  status: string; entry_refund_policy?: string; entry_payment_online?: boolean; entry_pay_at_check_in?: boolean;
};

export type Exhibitor = {
  id: string; organization_id: string; first_name?: string; last_name?: string; date_of_birth?: string;
  county?: string; club?: string; exhibitor_number?: string | number;
};

export type Animal = { id: string; name?: string; breed?: string; sex?: string; ear_tag?: string; birth_date?: string };

export type Account = {
  fairs: Fair[];
  entries: Entry[];
  results: Result[];
  passes: { id: string; organization_id: string; pass_code: string; person_name: string; event_name: string; wallet_pass_url?: string }[];
};

export type FairData = {
  fair: Fair;
  names: { shows: Record<string, string>; classes: Record<string, string> };
  shows: Show[];
  entries: Entry[];
  exhibitors: Exhibitor[];
  results: Result[];
};

export type WeighWindow = { id: string; opens_at: string; closes_at: string; method: string; require_photo: boolean; instructions: string };

export type WeighEntry = {
  id: string; organization_id: string; entry_number: string | number | null; show_id: string; show_name: string | null;
  class_name: string | null; class_code: string | null; animal_name: string | null; exhibitor_name: string | null;
  status: string; weight: number | null; weight_status: string; has_photo: boolean; weight_unit: string;
  min_weight: number | null; max_weight: number | null; allow_decimals: boolean; allow_changes: boolean;
  instructions: string; can_submit_now: boolean; open_window: WeighWindow | null; next_window: WeighWindow | null;
};

export type QueueItem = {
  class_id: string; class_name: string; department_name: string; division_name: string; entry_count: number | null;
  state: 'queued' | 'calling' | 'done'; started_at: string | null;
  mine: { entry_id: string; entry_number: string | number | null; animal_name: string; exhibitor_name: string }[];
};

export type Ring = {
  id: string; show_id: string; name: string; status: string; current_class_id: string | null;
  current_class_name: string | null; current_started_at: string | null; updated_date: string | null; queue: QueueItem[];
};

export type MyClass = {
  ring_id: string; ring_name: string; show_id: string; class_id: string; class_name: string;
  state: 'in_ring' | 'on_deck' | 'later'; classes_ahead: number; mine: QueueItem['mine'];
};

export type RingData = { fair: Fair; shows: { id: string; name: string; status: string }[]; rings: Ring[]; my_classes: MyClass[] };

export type AppNotification = {
  id: string; organization_id: string; category: string; title: string; body: string;
  data: Record<string, string>; read: boolean; created_date: string;
};

export type Conversation = {
  id: string; organization_id: string; subject: string; category: string; status: string;
  last_message_preview: string; last_activity_at: string; unread: boolean; fair_name?: string;
};

export type Message = { id: string; author_type: 'requester' | 'staff' | 'system'; author_name: string; body: string; created_date: string };

export type SignDoc = {
  id: string; document_name: string; status: string; fair_name: string; organization_id: string;
  sent_at?: string; completed_at?: string;
};
