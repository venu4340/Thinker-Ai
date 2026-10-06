import uuid
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, model_validator

class ObjectiveSchema(BaseModel):
    title: str = Field("Primary Goal Objective", description="Clear title of the objective")
    description: Optional[str] = Field(None, description="Detailed explanation of what this objective achieves")
    target_metric: Optional[str] = Field(None, description="Quantifiable target or metric for success")
    priority: str = Field("high", description="low, medium, or high")

    @model_validator(mode="before")
    @classmethod
    def normalize_objective(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"title": data, "description": data, "priority": "high"}
        if isinstance(data, dict):
            if "name" in data and "title" not in data:
                data["title"] = data["name"]
        return data

class TaskSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:6]}", description="Unique task identifier")
    title: str = Field("Task Item", description="Actionable task title")
    description: Optional[str] = Field(None, description="Concise description and implementation details")
    priority: str = Field("medium", description="low, medium, high, critical")
    estimated_hours: float = Field(8.0, description="Realistic estimate in hours")
    phase_id: Optional[str] = Field(None, description="Phase ID this task belongs to")
    dependencies: List[str] = Field(default_factory=list, description="IDs of tasks that must finish before this starts")
    skills_required: List[str] = Field(default_factory=list, description="Skills or domain expertise needed")
    resources: List[str] = Field(default_factory=list, description="Tools, APIs, services, or budget items needed")
    acceptance_criteria: List[str] = Field(default_factory=list, description="Testable items that verify task is done")

    @model_validator(mode="before")
    @classmethod
    def normalize_task(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"id": f"task_{uuid.uuid4().hex[:6]}", "title": data, "description": data}
        if isinstance(data, dict):
            if "name" in data and "title" not in data:
                data["title"] = data["name"]
            if "id" not in data or not data["id"]:
                data["id"] = f"task_{uuid.uuid4().hex[:6]}"
        return data

class PhaseSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"phase_{uuid.uuid4().hex[:6]}", description="Phase ID")
    title: str = Field("Execution Phase", description="Phase title")
    description: Optional[str] = Field(None, description="Summary of phase deliverables")
    order: int = Field(0, description="Sequential phase order")
    estimated_weeks: Optional[float] = Field(2.0, description="Estimated duration in weeks")
    tasks: List[TaskSchema] = Field(default_factory=list, description="Tasks within this phase")

    @model_validator(mode="before")
    @classmethod
    def normalize_phase(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"id": f"phase_{uuid.uuid4().hex[:6]}", "title": data, "description": data, "tasks": []}
        if isinstance(data, dict):
            for key in ["name", "phase_name", "phase_title", "phase"]:
                if key in data and "title" not in data:
                    data["title"] = data[key]
            if "id" not in data or not data["id"]:
                data["id"] = f"phase_{uuid.uuid4().hex[:6]}"
            if "tasks" in data and isinstance(data["tasks"], list):
                norm_tasks = []
                for t in data["tasks"]:
                    if isinstance(t, str):
                        norm_tasks.append({"id": f"task_{uuid.uuid4().hex[:6]}", "title": t, "description": t})
                    else:
                        norm_tasks.append(t)
                data["tasks"] = norm_tasks
        return data

class DependencySchema(BaseModel):
    source_task_id: str = Field("task_1", description="Predecessor task ID")
    target_task_id: str = Field("task_2", description="Successor task ID")
    type: str = Field("finish_to_start", description="Dependency relationship type")

    @model_validator(mode="before")
    @classmethod
    def normalize_dep(cls, data: Any) -> Any:
        if isinstance(data, dict):
            src = data.get("source_task_id") or data.get("source") or data.get("from") or data.get("predecessor") or data.get("task") or "task_1"
            tgt = data.get("target_task_id") or data.get("target") or data.get("to") or data.get("successor") or data.get("depends_on") or "task_2"
            return {"source_task_id": str(src), "target_task_id": str(tgt), "type": data.get("type", "finish_to_start")}
        return data

class RiskSchema(BaseModel):
    risk: str = Field("Identified Project Risk", description="Description of potential risk")
    probability: int = Field(3, description="1 to 5 scale")
    impact: int = Field(3, description="1 to 5 scale")
    severity: str = Field("medium", description="low, medium, high, critical")
    cause: Optional[str] = Field("Underlying technical or market uncertainty", description="Root cause")
    mitigation: Optional[str] = Field("Establish defensive verification and backup plans", description="Mitigation")
    owner: Optional[str] = Field("Project Lead", description="Role responsible for mitigating")

    @model_validator(mode="before")
    @classmethod
    def normalize_risk(cls, data: Any) -> Any:
        def parse_scale(val: Any) -> int:
            if isinstance(val, int):
                return max(1, min(5, val))
            if isinstance(val, str):
                v = val.lower().strip()
                if "crit" in v or "extreme" in v or "5" in v: return 5
                if "high" in v or "4" in v: return 4
                if "med" in v or "3" in v: return 3
                if "low" in v or "2" in v: return 2
                if "min" in v or "1" in v: return 1
            return 3

        if isinstance(data, str):
            return {"risk": data, "cause": "Uncertainty in implementation", "mitigation": "Review and test early", "probability": 3, "impact": 3}
        if isinstance(data, dict):
            for k in ["title", "name", "description", "risk_name"]:
                if k in data and "risk" not in data:
                    data["risk"] = data[k]
            if "risk" not in data or not data["risk"]:
                data["risk"] = "Operational Risk"
            if "description" in data and "cause" not in data:
                data["cause"] = data["description"]
            if "cause" not in data:
                data["cause"] = "Technical or architectural dependency"
            if "mitigation" not in data or not data["mitigation"]:
                data["mitigation"] = data.get("preventive_measure") or data.get("solution") or "Active monitoring and contingency planning"
            data["impact"] = parse_scale(data.get("impact", 3))
            data["probability"] = parse_scale(data.get("probability", data.get("likelihood", 3)))
        return data

class MilestoneSchema(BaseModel):
    title: str = Field("Key Milestone", description="Key milestone reached")
    description: Optional[str] = Field("Milestone completed successfully.", description="Significance of this milestone")
    estimated_week: int = Field(1, description="Week number milestone is expected")
    criteria: List[str] = Field(default_factory=list, description="Criteria that must be fulfilled")

    @model_validator(mode="before")
    @classmethod
    def normalize_milestone(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"title": data, "description": data, "estimated_week": 2, "criteria": [data]}
        if isinstance(data, dict):
            for k in ["name", "milestone_name", "milestone"]:
                if k in data and "title" not in data:
                    data["title"] = data[k]
            if "description" not in data or not data["description"]:
                data["description"] = data.get("title", "Milestone reached")
            if "criteria" not in data or not isinstance(data.get("criteria"), list):
                crit = data.get("deliverables") or data.get("criteria")
                data["criteria"] = [str(crit)] if crit else ["Core milestone deliverables completed"]
        return data

class ResourceSchema(BaseModel):
    name: str = Field("Resource", description="Resource name")
    type: str = Field("tool", description="human, tool, cloud, budget, license")
    cost_estimate: Optional[str] = Field(None, description="Estimated cost or tier")
    allocation: Optional[str] = Field(None, description="Allocation or time percentage")

    @model_validator(mode="before")
    @classmethod
    def normalize_resource(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"name": data, "type": "tool", "cost_estimate": "$0", "allocation": "100%"}
        if isinstance(data, dict):
            for k in ["title", "resource_name", "tool", "item"]:
                if k in data and "name" not in data:
                    data["name"] = data[k]
            if "name" not in data or not data["name"]:
                data["name"] = "Essential Tool / Service"
            if "type" not in data:
                data["type"] = "tool"
        return data

class DecisionSchema(BaseModel):
    decision: str = Field("Architecture Decision", description="Key technical or product decision")
    reason: Optional[str] = Field("Optimal performance and reliability trade-off", description="Why this decision was chosen")
    alternatives_considered: List[str] = Field(default_factory=list, description="Other options evaluated")
    impact: Optional[str] = Field("Enhances long-term development speed and maintainability", description="Long term impact")

    @model_validator(mode="before")
    @classmethod
    def normalize_decision(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"decision": data, "reason": "Standard industry best practice"}
        if isinstance(data, dict):
            for k in ["title", "decision_name", "choice"]:
                if k in data and "decision" not in data:
                    data["decision"] = data[k]
            if "decision" not in data or not data["decision"]:
                data["decision"] = "Architecture Strategy"
            if "reason" not in data or not data["reason"]:
                data["reason"] = data.get("rationale") or "Ensures optimal scalability and maintainability"
        return data

class ProjectPlanResponse(BaseModel):
    executive_summary: str = Field("Comprehensive execution strategy and roadmap.", description="Strategic overview")
    core_value_proposition: str = Field("Delivers high-impact outcomes through structured execution.", description="Core value")
    objectives: List[ObjectiveSchema] = Field(default_factory=list, description="List of primary and secondary project objectives")
    phases: List[PhaseSchema] = Field(default_factory=list, description="Structured sequential phases with nested tasks")
    dependencies: List[DependencySchema] = Field(default_factory=list, description="Explicit inter-task dependencies")
    risks: List[RiskSchema] = Field(default_factory=list, description="Identified risks with probability, impact, and mitigations")
    milestones: List[MilestoneSchema] = Field(default_factory=list, description="Critical milestones with criteria")
    resources: List[ResourceSchema] = Field(default_factory=list, description="Required team, tools, and infrastructure")
    recommended_decisions: List[DecisionSchema] = Field(default_factory=list, description="Initial architecture/product decisions")
    success_metrics: List[str] = Field(default_factory=list, description="KPIs and measurable outcomes")

    @model_validator(mode="before")
    @classmethod
    def normalize_plan(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "summary" in data and "executive_summary" not in data:
                data["executive_summary"] = data["summary"]
            if "decisions" in data and "recommended_decisions" not in data:
                data["recommended_decisions"] = data["decisions"]
            if "success_metrics" in data and isinstance(data["success_metrics"], list):
                norm_metrics = []
                for m in data["success_metrics"]:
                    if isinstance(m, dict):
                        norm_metrics.append(m.get("metric") or m.get("target") or str(m))
                    else:
                        norm_metrics.append(str(m))
                data["success_metrics"] = norm_metrics
        return data


class GoalProjectPlanResponse(ProjectPlanResponse):
    title: Optional[str] = Field(None, description="Crisp, professional title for the project or learning roadmap")
    category: Optional[str] = Field("Software", description="Category: Software, Education, Startup, Business, Personal, Research, Marketing, Other")
    timeframe: Optional[str] = Field(None, description="Realistic timeframe e.g. 6 months, 12 weeks")



# Critical Review Models
class AIChallengeItem(BaseModel):
    category: str = Field(description="Category: Unrealistic Assumption, Missing Requirement, Technical Bottleneck, Risk Blindspot, Timeline Flaw, Scalability Limit")
    issue: str = Field(description="Concise description of the challenge or vulnerability")
    why_it_matters: str = Field(description="Detailed explanation of potential failure mode")
    evidence_or_reasoning: str = Field(description="Why this plan is vulnerable to this issue")
    suggested_mitigation: str = Field(description="Actionable fix or pivot")
    severity: str = Field("high", description="low, medium, high, critical")

class AIChallengeResponse(BaseModel):
    overall_critique: str = Field(description="Summary assessment of plan feasibility, strengths and weak points")
    confidence_score: int = Field(75, description="Feasibility confidence score from 0 to 100")
    challenges: List[AIChallengeItem] = Field(description="Detailed list of critical challenges and weaknesses found")

# Multiple Approaches
class AIApproachOption(BaseModel):
    name: str = Field(description="Approach name, e.g. Low-Cost Bootstrapped, Speed-to-Market MVP, Enterprise Scalable")
    tagline: str = Field(description="Short summary of strategy")
    estimated_cost: str = Field(description="Budget estimate")
    estimated_time: str = Field(description="Timeframe estimate")
    complexity: str = Field("medium", description="low, medium, high, extreme")
    architecture_overview: str = Field(description="Summary of stack and technical choices")
    advantages: List[str] = Field(description="List of key benefits")
    disadvantages: List[str] = Field(description="List of trade-offs and downsides")
    risks: List[str] = Field(description="Unique risks to this approach")
    key_phases: List[str] = Field(description="Major phases for this approach")

class AIApproachResponse(BaseModel):
    problem_statement: str = Field(description="Summary of the core problem being tackled")
    approaches: List[AIApproachOption] = Field(description="3 distinct strategic approaches")

# Node-level Q&A / Assistance
class AINodeAdviceResponse(BaseModel):
    advice: str = Field(description="Actionable, expert direct guidance for the task or node")
    steps: List[str] = Field(default_factory=list, description="Step-by-step instructions or sub-tasks")
    recommended_tools: List[str] = Field(default_factory=list, description="Specific libraries, frameworks, or tools")
    common_pitfalls: List[str] = Field(default_factory=list, description="Mistakes to avoid")
    acceptance_checklist: List[str] = Field(default_factory=list, description="Checklist to consider task 100% complete")
