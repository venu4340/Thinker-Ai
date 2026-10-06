import datetime
import uuid
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    auth_provider = Column(String(50), default="local")  # "local" or "google"
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    role = Column(String(50), default="member")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Software")
    goal = Column(Text, nullable=True)
    budget = Column(String(100), nullable=True)
    timeframe = Column(String(100), nullable=True)
    team_size = Column(String(100), nullable=True)
    tech_stack = Column(Text, nullable=True)
    status = Column(String(50), default="in_progress") # planning, in_progress, completed, archived
    progress = Column(Float, default=0.0)
    canvas_layout = Column(JSON, nullable=True) # stores React Flow node positions, viewport
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    objectives = relationship("Objective", back_populates="project", cascade="all, delete-orphan")
    phases = relationship("Phase", back_populates="project", cascade="all, delete-orphan", order_by="Phase.order")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan", order_by="Task.order")
    dependencies = relationship("Dependency", back_populates="project", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="project", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan", order_by="desc(ProjectVersion.version_number)")
    generations = relationship("AIGeneration", back_populates="project", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="project", cascade="all, delete-orphan", order_by="desc(ActivityLog.created_at)")

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="editor") # owner, editor, viewer
    added_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Objective(Base):
    __tablename__ = "objectives"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_metric = Column(String(255), nullable=True)
    priority = Column(String(50), default="high")
    order = Column(Integer, default=0)

    project = relationship("Project", back_populates="objectives")

class Phase(Base):
    __tablename__ = "phases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    status = Column(String(50), default="not_started") # not_started, in_progress, completed
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    color = Column(String(50), default="#6366f1")

    project = relationship("Project", back_populates="phases")
    tasks = relationship("Task", back_populates="phase", cascade="all, delete-orphan", order_by="Task.order")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    phase_id = Column(String(36), ForeignKey("phases.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), default="medium") # low, medium, high, critical
    estimated_hours = Column(Float, default=4.0)
    actual_hours = Column(Float, default=0.0)
    status = Column(String(50), default="todo") # todo, in_progress, review, done, blocked
    owner = Column(String(255), nullable=True)
    skills_required = Column(JSON, default=list)
    resources = Column(JSON, default=list)
    acceptance_criteria = Column(JSON, default=list)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    order = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    project = relationship("Project", back_populates="tasks")
    phase = relationship("Phase", back_populates="tasks")

class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source_task_id = Column(String(36), nullable=False, index=True)
    target_task_id = Column(String(36), nullable=False, index=True)
    type = Column(String(50), default="finish_to_start")

    project = relationship("Project", back_populates="dependencies")

class Risk(Base):
    __tablename__ = "risks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    risk = Column(String(255), nullable=False)
    probability = Column(Integer, default=3) # 1-5
    impact = Column(Integer, default=3) # 1-5
    severity = Column(String(50), default="medium") # low, medium, high, critical
    cause = Column(Text, nullable=True)
    mitigation = Column(Text, nullable=True)
    owner = Column(String(255), nullable=True)
    status = Column(String(50), default="identified") # identified, mitigating, resolved, accepted

    project = relationship("Project", back_populates="risks")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending") # pending, achieved, delayed
    criteria = Column(JSON, default=list)

    project = relationship("Project", back_populates="milestones")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="human") # human, tool, cloud, budget, license
    cost = Column(String(100), nullable=True)
    allocation = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    project = relationship("Project", back_populates="resources")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    alternatives_considered = Column(JSON, default=list)
    impact = Column(Text, nullable=True)
    status = Column(String(50), default="approved") # proposed, approved, superseded
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="decisions")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="txt")
    file_size = Column(Integer, default=0)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # vector representation stored as list of floats

    document = relationship("Document", back_populates="chunks")

class ProjectVersion(Base):
    __tablename__ = "project_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    description = Column(String(255), nullable=False)
    snapshot_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(String(255), nullable=True)

    project = relationship("Project", back_populates="versions")

class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt_type = Column(String(100), nullable=False) # plan_generation, challenge, alternatives, ask_node, etc.
    prompt_text = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    structured_response = Column(JSON, nullable=True)
    model_used = Column(String(100), nullable=True)
    latency_ms = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="generations")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="activity_logs")

class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="Software")
    data = Column(JSON, nullable=False)
    is_featured = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── Chat / Conversation Models ─────────────────────────────────────────────────

class Conversation(Base):
    """A single conversation thread (like a ChatGPT conversation)."""
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)          # auto-generated from first message
    model = Column(String(100), default="gemini")       # last-used model provider
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])
    messages = relationship(
        "Message", back_populates="conversation",
        cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base):
    """A single message within a conversation."""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)            # user | assistant | system
    content = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)      # which provider generated this
    metadata_ = Column("metadata", JSON, nullable=True)  # e.g. {"plan": {...}, "sources": [...]}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
