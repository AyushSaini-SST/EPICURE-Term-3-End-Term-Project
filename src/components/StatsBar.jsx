import { useMemo } from 'react';

/**
 * StatsBar — Dashboard statistics overview.
 * Uses useMemo for computed stats.
 * Props:
 *   - stats: { total, fresh, warning, expired, categories }
 */
export default function StatsBar({ stats }) {
  const statCards = useMemo(() => [
    {
      icon: '📦',
      iconClass: 'accent',
      value: stats.total,
      valueClass: 'accent',
      label: 'Total Items',
    },
    {
      icon: '✅',
      iconClass: 'green',
      value: stats.fresh,
      valueClass: 'green',
      label: 'Fresh Items',
    },
    {
      icon: '⚠️',
      iconClass: 'orange',
      value: stats.warning,
      valueClass: 'orange',
      label: 'Expiring Soon',
    },
    {
      icon: '🚨',
      iconClass: 'red',
      value: stats.expired,
      valueClass: 'red',
      label: 'Expired / Critical',
    },
  ], [stats]);

  return (
    <div className="stats-bar" id="stats-bar">
      {statCards.map((card, idx) => (
        <div className="stat-card glass-card animate-in" key={idx}>
          <div className={`stat-icon ${card.iconClass}`}>
            {card.icon}
          </div>
          <div className="stat-info">
            <h3 className={card.valueClass}>{card.value}</h3>
            <p>{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
