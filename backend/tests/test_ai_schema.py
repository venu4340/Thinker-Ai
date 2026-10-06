import pytest
from app.ai.schemas import (
    ProjectPlanResponse, AIChallengeResponse, AIApproachResponse, AINodeAdviceResponse
)
from app.ai.simulation_provider import SimulationProvider
from app.ai.orchestrator import AIOrchestrator

@pytest.mark.asyncio
async def test_simulation_plan_generation():
    sim = SimulationProvider()
    data = await sim.generate_json(
        "system",
        "Build an on-demand grocery delivery service with instant dispatch",
        ProjectPlanResponse
    )
    validated = ProjectPlanResponse.model_validate(data)
    assert validated.executive_summary is not None
    assert len(validated.phases) >= 3
    assert len(validated.objectives) >= 2
    assert len(validated.risks) >= 2
    assert len(validated.milestones) >= 2
    
    # Verify tasks within phases
    all_tasks = [t for p in validated.phases for t in p.tasks]
    assert len(all_tasks) >= 5
    for task in all_tasks:
        assert task.id
        assert task.title
        assert task.estimated_hours > 0

@pytest.mark.asyncio
async def test_simulation_critical_challenge():
    sim = SimulationProvider()
    data = await sim.generate_json("system", "Test plan", AIChallengeResponse)
    validated = AIChallengeResponse.model_validate(data)
    assert len(validated.challenges) >= 3
    assert 0 <= validated.confidence_score <= 100
    for c in validated.challenges:
        assert c.category
        assert c.issue
        assert c.suggested_mitigation

@pytest.mark.asyncio
async def test_simulation_3_approaches():
    sim = SimulationProvider()
    data = await sim.generate_json("system", "Test plan", AIApproachResponse)
    validated = AIApproachResponse.model_validate(data)
    assert len(validated.approaches) == 3
    names = [a.name for a in validated.approaches]
    assert any("MVP" in n or "Speed" in n for n in names)
    assert any("Bootstrapped" in n or "Low-Cost" in n for n in names)
    assert any("Enterprise" in n or "Cloud" in n for n in names)

@pytest.mark.asyncio
async def test_ai_orchestrator_fallback():
    orchestrator = AIOrchestrator()
    plan = await orchestrator.generate_project_plan(
        title="AI Medical Imaging Triage",
        description="Machine learning diagnostic assistant for radiologist workflow",
        category="Healthcare",
        goal="Attain FDA clearance and integrate with hospital PACS"
    )
    assert plan["executive_summary"]
    assert len(plan["phases"]) >= 4
