"use client";

type Props = {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function EventCreateButton({ busy, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      className="t-btn-create-event"
      disabled={busy || disabled}
      onClick={onClick}
    >
      <span className="t-btn-create-event__shine" aria-hidden />
      <span className="t-btn-create-event__inner">
        <span className="t-btn-create-event__icon" aria-hidden>
          +
        </span>
        <span className="t-btn-create-event__copy">
          <span className="t-btn-create-event__label">
            {busy ? "Wird angelegt …" : "Event anlegen"}
          </span>
          <span className="t-btn-create-event__sub">
            {busy ? "Einen Moment" : "Turnier starten"}
          </span>
        </span>
        <span className="t-btn-create-event__arrow" aria-hidden>
          →
        </span>
      </span>
    </button>
  );
}
