import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "local"
    role: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    estimated_hours: float = 4.0
    actual_hours: float = 0.0
    status: str = "todo"
    owner: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)
    resources: List[str] = Field(default_factory=list)
    acceptance_criteria: List[str] = Field(default_factory=list)
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    position_x: Optional[float] = 0.0
    position_y: Optional[float] = 0.0
    notes: Optional[str] = None
    order: Optional[int] = 0

class TaskCreate(TaskBase):
    phase_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    status: Optional[str] = None
    owner: Optional[str] = None
    skills_required: Optional[List[str]] = None
    resources: Optional[List[str]] = None
    acceptance_criteria: Optional[List[str]] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    notes: Optional[str] = None
    phase_id: Optional[str] = None
    order: Optional[int] = None

class TaskResponse(TaskBase):
    id: str
    project_id: str
    phase_id: Optional[str] = None

    class Config:
        from_attributes = True

# Phase Schemas
class PhaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    status: str = "not_started"
    color: str = "#6366f1"
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None

class PhaseCreate(PhaseBase):
    pass

class PhaseResponse(PhaseBase):
    id: str
    project_id: str
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True

# Dependency Schemas
class DependencyBase(BaseModel):
    source_task_id: str
    target_task_id: str
    type: str = "finish_to_start"

class DependencyCreate(DependencyBase):
    pass

class DependencyResponse(DependencyBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# Risk Schemas
class RiskBase(BaseModel):
    risk: str
    probability: int = 3
    impact: int = 3
    severity: str = "medium"
    cause: Optional[str] = None
    mitigation: Optional[str] = None
    owner: Optional[str] = None
    status: str = "identified"

class RiskCreate(RiskBase):
    pass

class RiskUpdate(BaseModel):
    risk: Optional[str] = None
    probability: Optional[int] = None
    impact: Optional[int] = None
    severity: Optional[str] = None
    cause: Optional[str] = None
    mitigation: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None

class RiskResponse(RiskBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# Objective Schemas
class ObjectiveBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_metric: Optional[str] = None
    priority: str = "high"
    order: int = 0

class ObjectiveCreate(ObjectiveBase):
    pass

class ObjectiveResponse(ObjectiveBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# Milestone Schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None
    status: str = "pending"
    criteria: List[str] = Field(default_factory=list)

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneResponse(MilestoneBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# Resource Schemas
class ResourceBase(BaseModel):
    name: str
    type: str = "human"
    cost: Optional[str] = None
    allocation: Optional[str] = None
    notes: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# Decision Schemas
class DecisionBase(BaseModel):
    decision: str
    reason: str
    alternatives_considered: List[str] = Field(default_factory=list)
    impact: Optional[str] = None
    status: str = "approved"

class DecisionCreate(DecisionBase):
    pass

class DecisionResponse(DecisionBase):
    id: str
    project_id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    file_type: str
    file_size: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Version Schemas
class VersionResponse(BaseModel):
    id: str
    project_id: str
    version_number: int
    description: str
    snapshot_data: Dict[str, Any]
    created_at: datetime.datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Software"
    goal: Optional[str] = None
    budget: Optional[str] = None
    timeframe: Optional[str] = None
    team_size: Optional[str] = None
    tech_stack: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    goal: Optional[str] = None
    budget: Optional[str] = None
    timeframe: Optional[str] = None
    team_size: Optional[str] = None
    tech_stack: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    canvas_layout: Optional[Dict[str, Any]] = None

class ProjectSummaryResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    goal: Optional[str] = None
    status: str
    progress: float
    task_count: int = 0
    completed_task_count: int = 0
    risk_count: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class ProjectDetailResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: str
    goal: Optional[str] = None
    budget: Optional[str] = None
    timeframe: Optional[str] = None
    team_size: Optional[str] = None
    tech_stack: Optional[str] = None
    status: str
    progress: float
    canvas_layout: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    objectives: List[ObjectiveResponse] = []
    phases: List[PhaseResponse] = []
    tasks: List[TaskResponse] = []
    dependencies: List[DependencyResponse] = []
    risks: List[RiskResponse] = []
    milestones: List[MilestoneResponse] = []
    resources: List[ResourceResponse] = []
    decisions: List[DecisionResponse] = []
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True

# AI Operation Request Schemas
class GoalPlanRequest(BaseModel):
    goal: str
    category: Optional[str] = None
    timeframe: Optional[str] = None
    budget: Optional[str] = None
    tech_stack: Optional[str] = None
    custom_instructions: Optional[str] = None

class AIGeneratePlanRequest(BaseModel):
    custom_instructions: Optional[str] = None
    preferred_provider: Optional[str] = None
    document_ids: Optional[List[str]] = None


class AIAskNodeRequest(BaseModel):
    node_id: str
    node_type: str
    node_data: Dict[str, Any]
    question: str

class AIRefinePlanRequest(BaseModel):
    refinement_type: str # make_detailed, simplify, find_missing, optimize_timeline, find_risks
    instructions: Optional[str] = None

class TemplateResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    is_featured: bool
    data: Dict[str, Any]

    class Config:
        from_attributes = True
