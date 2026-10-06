import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import engine, Base, AsyncSessionLocal
from app.models.models import User, Project, Template, Conversation, Message
from app.core.security import get_password_hash
from app.services.project_service import project_service
from app.ai.simulation_provider import SimulationProvider

DEFAULT_TEMPLATES = [
    {
        "title": "Software SaaS Engineering Roadmap",
        "description": "Comprehensive agile blueprint for building modern cloud software with auth, microservices, frontend, automated CI/CD and monitoring.",
        "category": "Software",
        "data": {
            "title": "Modern Cloud SaaS Application",
            "category": "Software",
            "goal": "Build and deploy a scalable SaaS platform with 99.9% uptime and enterprise security.",
            "tech_stack": "FastAPI, React, PostgreSQL, Redis, Docker, AWS"
        }
    },
    {
        "title": "Startup Product-Market Fit & Launch",
        "description": "End-to-end founder playbook from problem validation, lean MVP prototyping, customer interviews to GTM launch.",
        "category": "Startup",
        "data": {
            "title": "AI B2B Startup Launch",
            "category": "Startup",
            "goal": "Validate problem-solution fit and onboard 25 paying pilot customers.",
            "budget": "$15,000",
            "timeframe": "12 weeks"
        }
    },
    {
        "title": "Academic & Scientific Research Project",
        "description": "Methodical research roadmap covering literature survey, empirical methodology, dataset curation, model training, and journal submission.",
        "category": "Research",
        "data": {
            "title": "Deep Learning Domain Adaptation Study",
            "category": "Research",
            "goal": "Publish empirical study on zero-shot domain adaptation in top-tier conference.",
            "tech_stack": "PyTorch, HuggingFace, LaTeX, Weights & Biases"
        }
    },
    {
        "title": "Multi-Channel Growth Marketing Campaign",
        "description": "Strategic acquisition funnel with high-converting landing pages, paid ads, lifecycle email automations, and CAC optimization.",
        "category": "Marketing",
        "data": {
            "title": "Q4 Enterprise Growth Acquisition Campaign",
            "category": "Marketing",
            "goal": "Generate 500 qualified sales demo bookings at under $80 CAC.",
            "budget": "$20,000"
        }
    },
    {
        "title": "College Senior Capstone Project",
        "description": "Structured academic semester milestone tracker covering requirement specs, weekly sprint deliverables, demo day, and thesis defense.",
        "category": "Education",
        "data": {
            "title": "Smart Campus IoT Energy Management System",
            "category": "Education",
            "goal": "Complete capstone deliverables, prototype hardware integration, and pass final faculty review.",
            "timeframe": "16 weeks"
        }
    },
    {
        "title": "Global Tech Conference / Event Planning",
        "description": "Complete operations roadmap for venue scouting, speaker curation, ticketing, sponsor outreach, and day-of-show logistics.",
        "category": "Personal",
        "data": {
            "title": "DevCon 2027 International Conference",
            "category": "Personal",
            "goal": "Host 800+ attendees with 30 world-class speakers and positive attendee CSAT > 92%."
        }
    }
]

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

        # Migrate existing databases: add new Google OAuth columns if missing
        # (create_all won't add columns to existing tables)
        from sqlalchemy import text
        for alter_sql in [
            "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)",
            "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'",
            "ALTER TABLE users ADD COLUMN google_id VARCHAR(255)",
        ]:
            try:
                await conn.execute(text(alter_sql))
            except Exception:
                pass  # Column already exists — safe to ignore

    async with AsyncSessionLocal() as db:
        # Check if demo user exists
        q_user = select(User).where(User.email == "demo@thinkflow.ai")
        res_user = await db.execute(q_user)
        demo_user = res_user.scalar_one_or_none()

        if not demo_user:
            demo_user = User(
                email="demo@thinkflow.ai",
                hashed_password=get_password_hash("demo12345"),
                full_name="Alex Mercer (Demo Lead)",
                role="admin"
            )
            db.add(demo_user)
            await db.commit()
            await db.refresh(demo_user)

            # Seed preloaded Demo Project: "AI-Powered Food Delivery Platform"
            q_proj = select(Project).where(Project.user_id == demo_user.id)
            res_proj = await db.execute(q_proj)
            existing_p = res_proj.scalar_one_or_none()

            if not existing_p:
                sim = SimulationProvider()
                food_plan = sim._generate_simulated_project_plan("Build an AI-powered food delivery platform", "food delivery")
                
                demo_project = Project(
                    user_id=demo_user.id,
                    title="AI-Powered On-Demand Food Delivery Platform",
                    description="Autonomous route-optimized food delivery ecosystem connecting hungry diners, local restaurants, and fleet couriers in real-time.",
                    category="Startup",
                    goal="Launch live beta across 3 metropolitan zones with 50+ partnered restaurants and sub-28 min average delivery time.",
                    budget="$40,000 Initial Pilot",
                    timeframe="14 Weeks to Beta Launch",
                    team_size="4 Engineers, 1 Product Designer, 1 Ops Lead",
                    tech_stack="FastAPI, React Native, PostgreSQL PostGIS, Redis, Stripe, Mapbox",
                    status="in_progress",
                    progress=25.0
                )
                db.add(demo_project)
                await db.commit()
                await db.refresh(demo_project)

                await project_service.apply_ai_plan_to_project(
                    db, demo_project, food_plan, version_desc="Baseline Initial AI Plan"
                )

        # Seed templates
        for t_data in DEFAULT_TEMPLATES:
            q_t = select(Template).where(Template.title == t_data["title"])
            res_t = await db.execute(q_t)
            if not res_t.scalar_one_or_none():
                template = Template(
                    title=t_data["title"],
                    description=t_data["description"],
                    category=t_data["category"],
                    data=t_data["data"],
                    is_featured=True
                )
                db.add(template)
        
        await db.commit()
