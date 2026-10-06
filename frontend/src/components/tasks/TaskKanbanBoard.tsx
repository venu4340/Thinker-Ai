import React, { useState } from 'react';
import { 
  CheckSquare, Plus, User, Search
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { GoalExecutionSummary } from '../dashboard/GoalExecutionSummary';

export const TaskKanbanBoard: React.FC = () => {
  const { project, updateTask, createTask, setSelectedNode } = useProject();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPhaseId, setNewPhaseId] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newHours, setNewHours] = useState(4);
  const [newOwner, setNewOwner] = useState('');

  if (!project) return null;

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-slate-700' },
    { id: 'in_progress', title: 'In Progress', color: 'border-[#38BDF8]' },
    { id: 'review', title: 'In Review', color: 'border-amber-500' },
    { id: 'done', title: 'Completed', color: 'border-emerald-500' },
    { id: 'blocked', title: 'Blocked', color: 'border-rose-500' },
  ];

  const filteredTasks = project.tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.owner && t.owner.toLowerCase().includes(search.toLowerCase()));
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    await createTask({
      title: newTitle,
      description: newDesc,
      phase_id: newPhaseId || (project.phases[0]?.id),
      priority: newPriority,
      estimated_hours: Number(newHours),
      owner: newOwner || 'Lead Engineer',
      status: 'todo',
    });
    setIsAddOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#27E6B5]" />
            Smart Task Execution Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kanban workflow tracking with acceptance criteria, priority filtering, and owner assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-[#0C1220] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0C1220] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* Goal & Milestone Execution Highlights */}
      <GoalExecutionSummary project={project} />

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const colHours = colTasks.reduce((acc, t) => acc + (t.estimated_hours || 4), 0);

          return (
            <div
              key={col.id}
              className="bg-[#0C1220]/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full border-2 ${col.color}`} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#05080D] text-slate-300 font-mono">
                    {colTasks.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {colHours}h
                  </span>
                </div>
              </div>

              {/* Task Cards in Column */}
              <div className="space-y-2.5 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedNode({ id: task.id, type: 'taskNode', data: task })}
                    className="p-3 bg-[#080D16]/90 border border-slate-800 hover:border-[#27E6B5]/50 rounded-xl cursor-pointer transition-all hover:scale-[1.01] shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warning' : 'teal'
                        }
                        size="sm"
                      >
                        {task.priority.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">{task.estimated_hours}h</span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 line-clamp-2">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-[100px]">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{task.owner || 'Lead'}</span>
                      </div>

                      {/* Status select */}
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                        className="bg-[#05080D] border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Actionable Task"
        description="Add a task with estimated hours, priority, and phase assignment."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Task Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Implement WebSockets order dispatch channel"
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Phase Assignment</label>
            <select
              value={newPhaseId}
              onChange={(e) => setNewPhaseId(e.target.value)}
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            >
              {project.phases.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Estimated Hours</label>
              <input
                type="number"
                value={newHours}
                onChange={(e) => setNewHours(Number(e.target.value))}
                className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Assignee</label>
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-[#0C1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description / Implementation Notes</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Technical instructions and deliverables..."
              className="w-full bg-[#0C1220] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#27E6B5]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTask}>
              Create Task
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
