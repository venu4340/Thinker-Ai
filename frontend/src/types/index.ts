export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  auth_provider?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Task {
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_hours: number;
  actual_hours: number;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  owner?: string;
  skills_required: string[];
  resources: string[];
  acceptance_criteria: string[];
  start_date?: string;
  end_date?: string;
  position_x: number;
  position_y: number;
  notes?: string;
  order?: number;
}

export interface Phase {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed';
  color: string;
  start_date?: string;
  end_date?: string;
  tasks: Task[];
}

export interface Dependency {
  id: string;
  project_id: string;
  source_task_id: string;
  target_task_id: string;
  type: string;
}

export interface Risk {
  id: string;
  project_id: string;
  risk: string;
  probability: number; // 1-5
  impact: number; // 1-5
  severity: 'low' | 'medium' | 'high' | 'critical';
  cause?: string;
  mitigation?: string;
  owner?: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
}

export interface Objective {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  target_metric?: string;
  priority: 'low' | 'medium' | 'high';
  order: number;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  estimated_week?: number;
  status: 'pending' | 'achieved' | 'delayed';
  criteria: string[];
}

export interface Resource {
  id: string;
  project_id: string;
  name: string;
  type: 'human' | 'tool' | 'cloud' | 'budget' | 'license';
  cost?: string;
  allocation?: string;
  notes?: string;
}

export interface Decision {
  id: string;
  project_id: string;
  decision: string;
  reason: string;
  alternatives_considered: string[];
  impact?: string;
  status: 'proposed' | 'approved' | 'superseded';
  created_at: string;
}

export interface DocumentItem {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface VersionItem {
  id: string;
  project_id: string;
  version_number: number;
  description: string;
  snapshot_data: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description?: string;
  category: string;
  goal?: string;
  status: string;
  progress: number;
  task_count: number;
  completed_task_count: number;
  risk_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  goal?: string;
  budget?: string;
  timeframe?: string;
  team_size?: string;
  tech_stack?: string;
  status: string;
  progress: number;
  canvas_layout?: Record<string, any>;
  created_at: string;
  updated_at: string;

  objectives: Objective[];
  phases: Phase[];
  tasks: Task[];
  dependencies: Dependency[];
  risks: Risk[];
  milestones: Milestone[];
  resources: Resource[];
  decisions: Decision[];
  documents: DocumentItem[];
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  is_featured: boolean;
  data: {
    title: string;
    category: string;
    goal?: string;
    budget?: string;
    timeframe?: string;
    tech_stack?: string;
  };
}

export interface AIChallengeItem {
  category: string;
  issue: string;
  why_it_matters: string;
  evidence_or_reasoning: string;
  suggested_mitigation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIChallengeResponse {
  overall_critique: string;
  confidence_score: number;
  challenges: AIChallengeItem[];
}

export interface AIApproachOption {
  name: string;
  tagline: string;
  estimated_cost: string;
  estimated_time: string;
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  architecture_overview: string;
  advantages: string[];
  disadvantages: string[];
  risks: string[];
  key_phases: string[];
}

export interface AIApproachResponse {
  problem_statement: string;
  approaches: AIApproachOption[];
}

export interface AINodeAdviceResponse {
  advice: string;
  steps: string[];
  recommended_tools: string[];
  common_pitfalls: string[];
  acceptance_checklist: string[];
}
