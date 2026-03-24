import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import UndoToast from '../components/UndoToast';
import { taskAPI, userAPI } from '../api';

const columns = [
  { id: 'Todo', title: 'To Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Done', title: 'Done' }
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [undoTask, setUndoTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('asc');

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, userRes] = await Promise.all([taskAPI.getAll(), userAPI.getAll()]);
      setTasks(taskRes.data);
      setUsers(userRes.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const isSearching = searchQuery || fromDate || toDate;
      const isSorting = sortBy !== 'created_at' || sortOrder !== 'asc';

      if (isSearching) {
        const params = {};
        if (searchQuery) params.q = searchQuery;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        const res = await taskAPI.search(params);
        let data = res.data;
        if (isSorting) {
          data = sortLocal(data, sortBy, sortOrder);
        }
        setTasks(data);
      } else if (isSorting) {
        const res = await taskAPI.sort({ sort_by: sortBy, order: sortOrder });
        setTasks(res.data);
      } else {
        const res = await taskAPI.getAll();
        setTasks(res.data);
      }
    } catch {
        // error
    }
  }, [searchQuery, fromDate, toDate, sortBy, sortOrder]);

  function sortLocal(data, field, order) {
    return [...data].sort((a, b) => {
      let valA, valB;
      if (field === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else {
        valA = a[field] ? new Date(a[field]).getTime() : 0;
        valB = b[field] ? new Date(b[field]).getTime() : 0;
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if(searchQuery || fromDate || toDate || sortBy !== 'created_at' || sortOrder !== 'asc') {
       fetchTasks();
    } else {
       // Just refetching everything to clear search is effectively fetching all tasks
       taskAPI.getAll().then(res => setTasks(res.data)).catch(()=>{});
    }
  }, [searchQuery, fromDate, toDate, sortBy, sortOrder, fetchTasks]);


  const handleAddTask = async (taskData) => {
    await taskAPI.create(taskData);
    toast.success('Task created successfully!');
    fetchTasks();
  };

  const handleDelete = async (taskId) => {
    try {
      await taskAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setUndoTask({ id: taskId });
      if(selectedTask && selectedTask.id === taskId) setSelectedTask(null);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleUndo = async () => {
    if (!undoTask) return;
    try {
      await taskAPI.restore(undoTask.id);
      setUndoTask(null);
      toast.info('Task restored!');
      fetchTasks();
    } catch {
      toast.error('Could not restore task — undo window expired');
      setUndoTask(null);
    }
  };

  const handleUndoExpire = useCallback(() => {
    setUndoTask(null);
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSortBy('created_at');
    setSortOrder('asc');
  };

  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
  };

  const hasDateRange = fromDate || toDate;

  const sortOptions = [
    { value: 'created_at|asc', label: 'Created (Earliest)' },
    { value: 'created_at|desc', label: 'Created (Latest)' },
    { value: 'deadline_date|asc', label: 'Deadline (Nearest)' },
    { value: 'deadline_date|desc', label: 'Deadline (Farthest)' },
    { value: 'title|asc', label: 'Title (A-Z)' },
    { value: 'title|desc', label: 'Title (Z-A)' },
  ];

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('|');
    setSortBy(field);
    setSortOrder(order);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
    }

    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    
    // Optimistic update
    setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
        await taskAPI.updateStatus(taskId, newStatus);
    } catch(err) {
        toast.error("Failed to update status");
        fetchTasks();
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-main">
        <div className="controls-bar">
          <div className="search-section">
            <div className="search-input-wrapper">
              <span className="search-icon">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.65" y1="16.65" x2="21" y2="21"/></svg>
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="date-filters">
              <div className="date-field">
                <label>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || today}
                />
              </div>
              <div className="date-field">
                <label>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate || undefined}
                  max={today}
                />
              </div>
              {hasDateRange && (
                <button
                  className="btn-date-clear"
                  onClick={clearDateRange}
                  title="Clear date range"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div className="actions-section">
            <select
              className="sort-select"
              value={`${sortBy}|${sortOrder}`}
              onChange={handleSortChange}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {(searchQuery || fromDate || toDate || sortBy !== 'created_at' || sortOrder !== 'asc') && (
              <button className="btn btn-ghost" onClick={clearFilters}>
                Clear All
              </button>
            )}
            <button
              className="btn btn-primary btn-glow add-task-btn"
              onClick={() => setShowAddModal(true)}
            >
              &#10010; Add Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
                {columns.map(col => {
                    const columnTasks = tasks.filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className="kanban-column">
                            <div className="kanban-header">
                                <h3>{col.title}</h3>
                                <span className="kanban-badge">{columnTasks.length}</span>
                            </div>
                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div 
                                        className="kanban-tasks"
                                        ref={provided.innerRef} 
                                        {...provided.droppableProps}
                                        style={{ background: snapshot.isDraggingOver ? 'rgba(0, 212, 170, 0.05)' : '' }}
                                    >
                                        {columnTasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef} 
                                                        {...provided.draggableProps} 
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            opacity: snapshot.isDragging ? 0.8 : 1,
                                                            transform: provided.draggableProps.style?.transform,
                                                            marginBottom: '1rem'
                                                        }}
                                                    >
                                                        <TaskCard
                                                            task={task}
                                                            onClick={setSelectedTask}
                                                            onDelete={handleDelete}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
          </DragDropContext>
        )}
      </main>
      <Footer />

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
          users={users}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={tasks.find(t => t.id === selectedTask.id) || selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDelete}
          users={users}
          onTaskUpdate={() => {fetchTasks()}}
        />
      )}

      {undoTask && (
        <UndoToast
          message="Task Deleted"
          onUndo={handleUndo}
          onExpire={handleUndoExpire}
        />
      )}
    </div>
  );
}
