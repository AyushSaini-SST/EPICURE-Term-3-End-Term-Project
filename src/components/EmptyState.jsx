/**
 * EmptyState — Reusable empty state display.
 * Props:
 *   - icon: emoji/icon string
 *   - title: heading text
 *   - message: description text
 *   - action: optional button JSX
 */
export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state" id="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && action}
    </div>
  );
}
