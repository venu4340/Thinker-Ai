import os
import sys

# Add the backend directory to sys.path so backend/app modules resolve cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(repo_root, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from app.main import app

# Export app for Vercel Serverless Function
__all__ = ["app"]
