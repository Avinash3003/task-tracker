export default function TaskCard({ task, onClick, onDelete }) {
  const formatCreatedDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeadlineInfo = (d) => {
    if (!d) return { text: 'No deadline', days: null };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(d);
    deadline.setHours(0, 0, 0, 0);
    const diffMs = deadline - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, days: diffDays };
    if (diffDays === 0) return { text: 'Due today', days: 0 };
    if (diffDays === 1) return { text: '1 day left', days: 1 };
    return { text: `${diffDays} days left`, days: diffDays };
  };

  const getDeadlineColor = (days) => {
    if (days === null) return 'var(--text-muted)';
    if (days < 0) return '#ef4444';
    if (days === 0) return '#f97316';
    if (days <= 2) return '#f59e0b';
    if (days <= 7) return '#eab308';
    if (days <= 14) return '#84cc16';
    return '#10b981';
  };

  const deadline = getDeadlineInfo(task.deadline_date);
  const deadlineColor = getDeadlineColor(deadline.days);

  return (
    <div className="task-card" onClick={() => onClick(task)}>
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <button
          className="task-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
        >
          &#128465;
        </button>
      </div>
      <p className="task-card-desc">
        {task.description || 'No description'}
      </p>
      <div className="task-card-footer">
        <span className="task-created-text">
          created on {formatCreatedDate(task.created_at)}
        </span>
        <span
          className="task-deadline-badge"
          style={{
            color: deadlineColor,
            borderColor: deadlineColor,
            boxShadow: deadline.days !== null && deadline.days <= 2
              ? `0 0 8px ${deadlineColor}40`
              : 'none',
          }}
        >
          {deadline.text}
        </span>
      </div>
    </div>
  );
}
