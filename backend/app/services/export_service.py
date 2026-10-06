import json
import csv
import io
from typing import Dict, Any
from app.models.models import Project

class ExportService:
    @staticmethod
    def export_markdown(project: Project) -> str:
        md = []
        md.append(f"# {project.title}")
        md.append(f"**Category:** {project.category} | **Status:** {project.status} | **Progress:** {project.progress:.1f}%\n")
        
        if project.goal:
            md.append(f"## 🎯 Goal\n{project.goal}\n")
        
        if project.description:
            md.append(f"## 💡 Concept Overview\n{project.description}\n")

        if project.objectives:
            md.append("## 📌 Objectives")
            for obj in project.objectives:
                md.append(f"- **{obj.title}** ({obj.priority.upper()}): {obj.description or ''}")
                if obj.target_metric:
                    md.append(f"  *Target Metric:* `{obj.target_metric}`")
            md.append("")

        if project.phases:
            md.append("## 🗺️ Phases & Execution Roadmap")
            for ph in project.phases:
                md.append(f"### {ph.title} (Status: {ph.status})")
                if ph.description:
                    md.append(f"*{ph.description}*\n")
                if ph.tasks:
                    for t in ph.tasks:
                        skills = f" [{', '.join(t.skills_required)}]" if t.skills_required else ""
                        md.append(f"- [{ 'x' if t.status == 'done' else ' ' }] **{t.title}** ({t.priority}, {t.estimated_hours}h){skills}")
                        if t.description:
                            md.append(f"  - *Details:* {t.description}")
                        if t.acceptance_criteria:
                            md.append(f"  - *Acceptance Criteria:* {'; '.join(t.acceptance_criteria)}")
                md.append("")

        if project.risks:
            md.append("## ⚠️ Risk Register & Mitigations")
            md.append("| Risk | Severity | Probability | Impact | Mitigation | Owner |")
            md.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
            for r in project.risks:
                md.append(f"| {r.risk} | {r.severity.upper()} | {r.probability}/5 | {r.impact}/5 | {r.mitigation or 'N/A'} | {r.owner or 'Unassigned'} |")
            md.append("")

        if project.decisions:
            md.append("## ⚖️ Architectural & Design Decisions")
            for d in project.decisions:
                md.append(f"### {d.decision}")
                md.append(f"- **Rationale:** {d.reason}")
                if d.alternatives_considered:
                    md.append(f"- **Alternatives Considered:** {', '.join(d.alternatives_considered)}")
                if d.impact:
                    md.append(f"- **Impact:** {d.impact}")
                md.append("")

        if project.resources:
            md.append("## 👥 Required Resources & Infrastructure")
            for res in project.resources:
                md.append(f"- **{res.name}** ({res.type}) — Cost: {res.cost or 'N/A'}, Allocation: {res.allocation or 'N/A'}")
            md.append("")

        return "\n".join(md)

    @staticmethod
    def export_csv(project: Project) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Task ID", "Title", "Phase", "Priority", "Status", 
            "Estimated Hours", "Owner", "Skills Required", "Acceptance Criteria"
        ])
        
        phase_map = {p.id: p.title for p in project.phases}
        for t in project.tasks:
            writer.writerow([
                t.id,
                t.title,
                phase_map.get(t.phase_id, "Unassigned"),
                t.priority,
                t.status,
                t.estimated_hours,
                t.owner or "",
                ", ".join(t.skills_required or []),
                " | ".join(t.acceptance_criteria or [])
            ])
        
        return output.getvalue()

    @staticmethod
    def export_json(project: Project) -> Dict[str, Any]:
        return {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "category": project.category,
            "goal": project.goal,
            "budget": project.budget,
            "timeframe": project.timeframe,
            "team_size": project.team_size,
            "tech_stack": project.tech_stack,
            "status": project.status,
            "progress": project.progress,
            "objectives": [
                {"title": o.title, "description": o.description, "target_metric": o.target_metric, "priority": o.priority}
                for o in project.objectives
            ],
            "phases": [
                {
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "order": p.order,
                    "status": p.status,
                    "color": p.color,
                    "tasks": [
                        {
                            "id": t.id,
                            "title": t.title,
                            "description": t.description,
                            "priority": t.priority,
                            "estimated_hours": t.estimated_hours,
                            "status": t.status,
                            "owner": t.owner,
                            "skills_required": t.skills_required,
                            "resources": t.resources,
                            "acceptance_criteria": t.acceptance_criteria
                        }
                        for t in p.tasks
                    ]
                }
                for p in project.phases
            ],
            "dependencies": [
                {"source": d.source_task_id, "target": d.target_task_id, "type": d.type}
                for d in project.dependencies
            ],
            "risks": [
                {
                    "risk": r.risk,
                    "probability": r.probability,
                    "impact": r.impact,
                    "severity": r.severity,
                    "cause": r.cause,
                    "mitigation": r.mitigation,
                    "owner": r.owner,
                    "status": r.status
                }
                for r in project.risks
            ],
            "milestones": [
                {"title": m.title, "description": m.description, "status": m.status, "criteria": m.criteria}
                for m in project.milestones
            ],
            "decisions": [
                {"decision": d.decision, "reason": d.reason, "alternatives": d.alternatives_considered, "impact": d.impact}
                for d in project.decisions
            ],
            "resources": [
                {"name": res.name, "type": res.type, "cost": res.cost, "allocation": res.allocation}
                for res in project.resources
            ]
        }

export_service = ExportService()
