import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.init_db import init_db

@pytest.mark.asyncio
async def test_full_auth_and_planning_workflow():
    # Initialize DB schema
    await init_db()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "healthy"}

        # 2. Demo login
        res_login = await client.post("/api/v1/auth/demo-login")
        assert res_login.status_code == 200
        login_data = res_login.json()
        assert "access_token" in login_data
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. List projects (should see seeded food delivery project)
        res_list = await client.get("/api/v1/projects", headers=headers)
        assert res_list.status_code == 200
        projects = res_list.json()
        assert len(projects) >= 1

        # 4. Create new project
        create_payload = {
            "title": "Automated Logistics Hub",
            "description": "Smart route optimization for autonomous delivery drones",
            "category": "Software",
            "goal": "Deliver sub-15 minute dropoffs",
            "budget": "$50,000",
            "timeframe": "12 weeks"
        }
        res_create = await client.post("/api/v1/projects", json=create_payload, headers=headers)
        assert res_create.status_code == 200
        new_proj = res_create.json()
        proj_id = new_proj["id"]
        assert new_proj["title"] == "Automated Logistics Hub"

        # 5. Generate AI Plan
        res_gen = await client.post(
            f"/api/v1/projects/{proj_id}/generate",
            json={"custom_instructions": "Focus on fault tolerance and real-time telemetry"},
            headers=headers
        )
        assert res_gen.status_code == 200
        plan_proj = res_gen.json()
        assert len(plan_proj["phases"]) >= 3
        assert len(plan_proj["tasks"]) >= 5
        assert len(plan_proj["risks"]) >= 2

        # 6. Test Challenge plan
        res_challenge = await client.post(f"/api/v1/projects/{proj_id}/challenge", headers=headers)
        assert res_challenge.status_code == 200
        challenge_data = res_challenge.json()
        assert len(challenge_data["challenges"]) >= 3

        # 7. Test 3 Approaches
        res_approaches = await client.post(f"/api/v1/projects/{proj_id}/approaches", headers=headers)
        assert res_approaches.status_code == 200
        approaches_data = res_approaches.json()
        assert len(approaches_data["approaches"]) == 3

        # 8. Test Export Markdown
        res_exp = await client.get(f"/api/v1/projects/{proj_id}/export?format=markdown", headers=headers)
        assert res_exp.status_code == 200
        assert "# Automated Logistics Hub" in res_exp.text
