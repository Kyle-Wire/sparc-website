import { ALERT_CHANNELS, STAGES, type Profile } from "@/lib/house/profile";
import { saveProfile } from "@/app/account/profile/actions";
import "./house.css";

/** The profile form, for the account and (read only) for the public demo. */
export function ProfileForm({ p, email, saved, error, demo }: { p: Profile; email: string; saved: boolean; error: string | null; demo?: boolean }) {
  return (
    <form action={demo ? undefined : saveProfile} className="hx" aria-label="Your profile">
      <div className="hx-card">
        <div className="kicker">Profile</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 0" }}>So the account fits you</h2>
        <p style={{ marginTop: 8 }}>Every field is optional. Nothing here is shared or sold; it changes your greeting, the wording of your report and how storm alerts reach you.</p>
        {saved && <p className="order-done" role="status" style={{ marginTop: 10 }}>Saved.</p>}
        {error && <p className="journey-error" role="alert" style={{ marginTop: 10 }}>{error}</p>}
      </div>
      <div className="hx-form">
        <fieldset>
          <legend>You</legend>
          <label>
            Your name <small>We greet you by your first name.</small>
            <input className="input" name="display_name" defaultValue={p.display_name ?? ""} maxLength={80} autoComplete="name" />
          </label>
          <label>
            Email <small>Change it in Settings.</small>
            <input className="input" value={email} readOnly aria-readonly />
          </label>
          <label>
            Phone for storm texts <small>Only Storm Ahead uses it, and only if you choose texts below.</small>
            <input className="input" name="phone" defaultValue={p.phone ?? ""} inputMode="tel" autoComplete="tel" maxLength={24} />
          </label>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Units</div>
            <div className="hx-chips" role="radiogroup" aria-label="Units">
              <label><input type="radio" name="units" value="us" defaultChecked={p.units !== "metric"} />US: inches, °F, mph</label>
              <label><input type="radio" name="units" value="metric" defaultChecked={p.units === "metric"} />Metric</label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Where you are with the house</legend>
          <div className="hx-chips" role="radiogroup" aria-label="Where you are with the house">
            {STAGES.map((s) => (
              <label key={s.value}>
                <input type="radio" name="stage" value={s.value} defaultChecked={p.stage === s.value} />
                {s.label}
              </label>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Buying and owning read differently: “before you close” or “for your home”. Your inspection deadline is on your order, and we work to it.
          </p>
          <label>
            What worries you most about this house <small>We read it before your report goes out.</small>
            <textarea className="input" name="worries" defaultValue={p.worries ?? ""} maxLength={500} rows={3} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Storm Ahead alerts</legend>
          {(
            [
              ["alert_watching", "When a storm might reach you (Watching)", p.alert_watching],
              ["alert_preparing", "When it’s on course for you (Preparing)", p.alert_preparing],
            ] as const
          ).map(([name, label, v]) => (
            <label key={name}>
              {label}
              <select className="input" name={name} defaultValue={v}>
                {ALERT_CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Also tell <small>A name and how to reach them, for example a parent who lives nearby.</small>
            <input className="input" name="also_tell" defaultValue={p.also_tell ?? ""} maxLength={200} />
          </label>
          <label className="chk">
            <input type="checkbox" name="medical_power" defaultChecked={p.medical_power} />
            <span>Someone at home needs power for medical equipment. Alerts then put the risk of losing power first.</span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Sharing</legend>
          <label className="chk">
            <input type="checkbox" name="share_marks_house" defaultChecked={p.share_marks_house} />
            <span>When I share my plan with a contractor, show my house on the map. Off means the link shows the fixes and numbers only.</span>
          </label>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Contractor links come next. This choice sets how they will look. To delete your account and everything we hold about you, use Settings.
          </p>
        </fieldset>
      </div>
      <div>
        <button className="btn btn-accent" type="submit" disabled={demo}>
          {demo ? "Save (sign in to save)" : "Save"}
        </button>
      </div>
    </form>
  );
}
