"use client";

import { useState } from "react";

function cleanName(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 32);
}

export function LocalNameGate({ onSave }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const value = cleanName(name);
    if (!value) {
      setError("Enter a name to continue.");
      return;
    }
    onSave(value);
  }

  return (
    <div className="local-name-gate" role="dialog" aria-modal="true" aria-labelledby="local-name-title">
      <form className="local-name-card" onSubmit={submit}>
        <div className="eyebrow">LOCAL PROFILE</div>
        <h1 id="local-name-title">Sign in on this device</h1>
        <p>Use a name only. It stays in this browser; no account, email, or password is created.</p>
        <label className="local-name-label" htmlFor="local-profile-name">Name</label>
        <input
          id="local-profile-name"
          className="input local-name-input"
          type="text"
          autoComplete="nickname"
          autoFocus
          maxLength={32}
          value={name}
          onChange={(event) => { setName(event.target.value); setError(""); }}
          placeholder="Your name"
          required
        />
        {error && <div className="local-name-error" role="alert">{error}</div>}
        <button className="button-primary local-name-submit" type="submit" disabled={!cleanName(name)}>
          Continue <span aria-hidden="true">→</span>
        </button>
        <div className="local-name-note">Watchlist and settings also stay on this device.</div>
      </form>
    </div>
  );
}

export default function LocalProfileMenu({ name, onUpdate, onClear }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");

  function save(event) {
    event.preventDefault();
    const cleaned = cleanName(value);
    if (!cleaned) {
      setError("Enter a name to continue.");
      return;
    }
    onUpdate(cleaned);
    setEditing(false);
    setOpen(false);
    setError("");
  }

  return (
    <div className="local-profile-wrap">
      <button
        className="local-profile-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        title="Local profile saved on this device"
      >
        <span className="local-profile-avatar" aria-hidden="true">{cleanName(name).slice(0, 1).toUpperCase() || "?"}</span>
        <span className="local-profile-name">{name || "Set local name"}</span>
        <span className="local-profile-label">LOCAL</span>
      </button>
      {open && (
        <div className="local-profile-popover" role="menu">
          <div className="local-profile-popover-note">{name ? "Saved on this device only" : "No account is created; this name stays in your browser."}</div>
          <button type="button" role="menuitem" onClick={() => { setValue(name); setEditing(true); setOpen(false); }}>{name ? "Change name" : "Set local name"}</button>
          {name && <button type="button" role="menuitem" className="local-profile-clear" onClick={() => { setOpen(false); onClear(); }}>Clear local profile</button>}
        </div>
      )}
      {editing && (
        <div className="local-profile-edit-overlay" role="dialog" aria-modal="true" aria-labelledby="local-profile-edit-title">
          <form className="local-name-card local-name-card-compact" onSubmit={save}>
            <div className="eyebrow">LOCAL PROFILE</div>
            <h2 id="local-profile-edit-title">{name ? "Change your name" : "Set a local name"}</h2>
            <p>{name ? "Your name remains saved only in this browser." : "Enter a name to use this app on this device. No account is created."}</p>
            <label className="local-name-label" htmlFor="local-profile-edit">Name</label>
            <input id="local-profile-edit" className="input local-name-input" autoFocus maxLength={32} value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} required />
            {error && <div className="local-name-error" role="alert">{error}</div>}
            <div className="local-name-actions">
              <button className="button-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button className="button-primary" type="submit" disabled={!cleanName(value)}>Save name</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
