import os
import sys
import webbrowser
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Set UTF-8 encoding for stdout on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend directory to sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app

# Determine static assets directory
dist_dir = os.path.join(root_dir, "frontend", "dist")
assets_dir = os.path.join(dist_dir, "assets")
index_file = os.path.join(dist_dir, "index.html")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# SPA catch-all fallback
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        return None
    
    candidate = os.path.join(dist_dir, full_path)
    if os.path.exists(candidate) and os.path.isfile(candidate):
        return FileResponse(candidate)
    
    if os.path.exists(index_file):
        return FileResponse(
            index_file,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {"message": "Vui lòng build frontend bằng lệnh: cd frontend && npm run build"}

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3000))
    
    print("==================================================================")
    print("SMARTLIB - HE THONG QUAN LY THU VIEN THONG MINH (REACT + PYTHON)")
    print("==================================================================")
    print(f"React Web App: http://localhost:{PORT}")
    print(f"Backend API: http://localhost:{PORT}/api")
    print(f"API Documentation (Swagger UI): http://localhost:{PORT}/docs")
    print("==================================================================")
    print("Tai khoan Admin: admin / 123")
    print("Tai khoan Doc gia: reader / 123")
    print("==================================================================")
    
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")