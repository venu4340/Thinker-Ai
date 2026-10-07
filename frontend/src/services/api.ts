import {
  AuthResponse, ProjectDetail, ProjectSummary, Task, Risk, Decision,
  AIChallengeResponse, AIApproachResponse, AINodeAdviceResponse, TemplateItem, VersionItem, DocumentItem
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  public getToken(): string | null {
    let token = localStorage.getItem('thinkflow_token');
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )thinkflow_token=([^;]+)'));
      if (match && match[2]) {
        token = decodeURIComponent(match[2]);
        try {
          localStorage.setItem('thinkflow_token', token);
        } catch {}
      }
    }
    return token;
  }

  private setToken(token: string) {
    localStorage.setItem('thinkflow_token', token);
    if (typeof document !== 'undefined') {
      document.cookie = `thinkflow_token=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
    }
  }

  public clearToken() {
    localStorage.removeItem('thinkflow_token');
    if (typeof document !== 'undefined') {
      document.cookie = 'thinkflow_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure';
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    // Check for empty body (like 204 or file downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  // Auth APIs
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async demoLogin(): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/demo-login', {
      method: 'POST',
    });
    this.setToken(res.access_token);
    return res;
  }

  async googleLogin(): Promise<void> {
    const res = await this.request<{ authorization_url: string }>('/auth/google/login');
    window.location.href = res.authorization_url;
  }

  handleGoogleCallback(token: string): void {
    this.setToken(token);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Projects APIs
  async listProjects(): Promise<ProjectSummary[]> {
    return this.request<ProjectSummary[]>('/projects');
  }

  async getProject(projectId: string): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${projectId}`);
  }

  async generateFromGoal(
    goal: string,
    options?: {
      category?: string;
      timeframe?: string;
      budget?: string;
      tech_stack?: string;
      custom_instructions?: string;
    }
  ): Promise<ProjectDetail> {
    return this.request<ProjectDetail>('/projects/generate-from-goal', {
      method: 'POST',
      body: JSON.stringify({ goal, ...(options || {}) }),
    });
  }

  async createProject(data: {
    title: string;
    description?: string;
    category?: string;
    goal?: string;
    budget?: string;
    timeframe?: string;
    team_size?: string;
    tech_stack?: string;
  }): Promise<ProjectDetail> {

    return this.request<ProjectDetail>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(projectId: string, data: Partial<ProjectDetail>): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, { method: 'DELETE' });
  }

  // AI Planning APIs
  async generateAIPlan(projectId: string, customInstructions?: string, preferredProvider?: string): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${projectId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ custom_instructions: customInstructions, preferred_provider: preferredProvider }),
    });
  }

  async challengePlan(projectId: string): Promise<AIChallengeResponse> {
    return this.request<AIChallengeResponse>(`/projects/${projectId}/challenge`, {
      method: 'POST',
    });
  }

  async generate3Approaches(projectId: string): Promise<AIApproachResponse> {
    return this.request<AIApproachResponse>(`/projects/${projectId}/approaches`, {
      method: 'POST',
    });
  }

  async askNodeAdvice(projectId: string, nodeId: string, nodeType: string, nodeData: any, question: string): Promise<AINodeAdviceResponse> {
    return this.request<AINodeAdviceResponse>(`/projects/${projectId}/ask-node`, {
      method: 'POST',
      body: JSON.stringify({
        node_id: nodeId,
        node_type: nodeType,
        node_data: nodeData,
        question,
      }),
    });
  }

  async refinePlan(projectId: string, refinementType: string, instructions?: string): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${projectId}/refine`, {
      method: 'POST',
      body: JSON.stringify({
        refinement_type: refinementType,
        instructions,
      }),
    });
  }

  // Task & Node CRUD
  async createTask(projectId: string, task: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(projectId: string, taskId: string, data: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(projectId: string, taskId: string) {
    return this.request(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
  }

  async createDependency(projectId: string, sourceId: string, targetId: string) {
    return this.request(`/projects/${projectId}/tasks/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ source_task_id: sourceId, target_task_id: targetId }),
    });
  }

  async deleteDependency(projectId: string, dependencyId: string) {
    return this.request(`/projects/${projectId}/tasks/dependencies/${dependencyId}`, { method: 'DELETE' });
  }

  // Risk APIs
  async createRisk(projectId: string, risk: Partial<Risk>): Promise<Risk> {
    return this.request<Risk>(`/projects/${projectId}/risks`, {
      method: 'POST',
      body: JSON.stringify(risk),
    });
  }

  async updateRisk(projectId: string, riskId: string, data: Partial<Risk>): Promise<Risk> {
    return this.request<Risk>(`/projects/${projectId}/risks/${riskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRisk(projectId: string, riskId: string) {
    return this.request(`/projects/${projectId}/risks/${riskId}`, { method: 'DELETE' });
  }

  // Decision APIs
  async createDecision(projectId: string, decision: Partial<Decision>): Promise<Decision> {
    return this.request<Decision>(`/projects/${projectId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(decision),
    });
  }

  async deleteDecision(projectId: string, decisionId: string) {
    return this.request(`/projects/${projectId}/decisions/${decisionId}`, { method: 'DELETE' });
  }

  // Documents & RAG APIs
  async uploadDocument(projectId: string, file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<DocumentItem>(`/projects/${projectId}/documents`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteDocument(projectId: string, documentId: string) {
    return this.request(`/projects/${projectId}/documents/${documentId}`, { method: 'DELETE' });
  }

  // Version APIs
  async listVersions(projectId: string): Promise<VersionItem[]> {
    return this.request<VersionItem[]>(`/projects/${projectId}/versions`);
  }

  async restoreVersion(projectId: string, versionId: string): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/projects/${projectId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
  }

  // Templates APIs
  async listTemplates(): Promise<TemplateItem[]> {
    return this.request<TemplateItem[]>('/templates');
  }

  async useTemplate(templateId: string): Promise<ProjectDetail> {
    return this.request<ProjectDetail>(`/templates/${templateId}/use`, {
      method: 'POST',
    });
  }

  // Export URL helper
  getExportUrl(projectId: string, format: 'markdown' | 'csv' | 'json' | 'html'): string {
    return `${API_BASE}/projects/${projectId}/export?format=${format}`;
  }
}

export const api = new ApiClient();
