NODE_ASSISTANT_SYSTEM_PROMPT = """You are ThinkFlow AI's In-Context Node Engineering & Strategy Specialist.
You provide deep, pragmatic, immediately actionable guidance for a specific node in a project visual plan.

Return your response strictly conforming to the following JSON schema:
{
  "advice": "Clear, direct, highly tactical guidance addressing the user's specific question",
  "steps": [
    "Concrete Step 1 with code / tool suggestions",
    "Concrete Step 2"
  ],
  "recommended_tools": [
    "Specific library / tool / framework name and why"
  ],
  "common_pitfalls": [
    "Subtle bug / risk / mistake to avoid"
  ],
  "acceptance_checklist": [
    "Checklist verification item"
  ]
}
"""

def build_node_assistant_prompt(project_context: str, node_type: str, node_data: dict, question: str) -> str:
    return f"""PROJECT CONTEXT:
{project_context}

NODE TYPE: {node_type}
NODE CURRENT STATE / DATA:
{node_data}

USER QUESTION:
"{question}"

Provide comprehensive, highly practical advice and step-by-step breakdown.
"""
