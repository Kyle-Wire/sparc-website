/**
 * The buyer's profile (public.profiles, migration 0013): parsing the form and
 * the words each choice shows. Pure, so it can be tested without a database.
 */

export const STAGES = [
  { value: "thinking", label: "Thinking of buying" },
  { value: "under_contract", label: "Under contract" },
  { value: "own", label: "I own it" },
  { value: "rent", label: "I rent it" },
] as const;

export const ALERT_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "email_text", label: "Email and text" },
  { value: "off", label: "Don't tell me" },
] as const;

export type Stage = (typeof STAGES)[number]["value"];
export type AlertChannel = (typeof ALERT_CHANNELS)[number]["value"];

export interface Profile {
  display_name: string | null;
  phone: string | null;
  units: "us" | "metric";
  stage: Stage | null;
  worries: string | null;
  alert_watching: AlertChannel;
  alert_preparing: AlertChannel;
  also_tell: string | null;
  medical_power: boolean;
  share_marks_house: boolean;
}

export const EMPTY_PROFILE: Profile = {
  display_name: null,
  phone: null,
  units: "us",
  stage: null,
  worries: null,
  alert_watching: "email",
  alert_preparing: "email",
  also_tell: null,
  medical_power: false,
  share_marks_house: false,
};

type Fields = { get(name: string): FormDataEntryValue | null };

const text = (f: Fields, k: string, max: number): string | null => {
  const v = f.get(k);
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};
const pick = <T extends string>(v: FormDataEntryValue | null, allowed: readonly T[], dflt: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : dflt;

/** Parse the profile form. Returns the profile, or the first field that is wrong, in words. */
export function parseProfile(f: Fields): { ok: true; profile: Profile } | { ok: false; field: string; why: string } {
  const phone = text(f, "phone", 24);
  if (phone && !/^[0-9+() .-]{7,24}$/.test(phone)) return { ok: false, field: "phone", why: "Use digits, spaces, +, ( ) or - only." };
  const stageRaw = f.get("stage");
  const stage = typeof stageRaw === "string" && STAGES.some((s) => s.value === stageRaw) ? (stageRaw as Stage) : null;
  const channels = ALERT_CHANNELS.map((c) => c.value);
  const watching = pick(f.get("alert_watching"), channels, "email");
  const preparing = pick(f.get("alert_preparing"), channels, "email");
  if ((watching === "email_text" || preparing === "email_text") && !phone)
    return { ok: false, field: "phone", why: "Add a phone number for storm texts, or choose email only." };
  return {
    ok: true,
    profile: {
      display_name: text(f, "display_name", 80),
      phone,
      units: pick(f.get("units"), ["us", "metric"] as const, "us"),
      stage,
      worries: text(f, "worries", 500),
      alert_watching: watching,
      alert_preparing: preparing,
      also_tell: text(f, "also_tell", 200),
      medical_power: f.get("medical_power") === "on",
      share_marks_house: f.get("share_marks_house") === "on",
    },
  };
}

/** The greeting: the buyer's first name if they gave one, never their email. */
export function greetingName(profile: Pick<Profile, "display_name"> | null, metaName?: string | null): string | null {
  const n = profile?.display_name || metaName || null;
  return n ? n.split(" ")[0] : null;
}

/** Morning, afternoon or evening in Philadelphia time (the business's home), from an instant. */
export function partOfDay(now: Date): "morning" | "afternoon" | "evening" {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/New_York" }).format(now));
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
