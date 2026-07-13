import os
import re
import json

routes_dir = "routes"
app_file = "src/app/api.ts"

backend_routes = []
for file in os.listdir(routes_dir):
    if file.endswith(".js"):
        with open(os.path.join(routes_dir, file), "r", encoding="utf-8") as f:
            content = f.read()
            matches = re.findall(r"router\.(get|post|put|patch|delete)\(['\"]([^'\"]+)['\"]", content)
            for method, path in matches:
                backend_routes.append({"file": file, "method": method.upper(), "path": path})

mounts = {}
with open("server.js", "r", encoding="utf-8") as f:
    content = f.read()
    
    matches = re.findall(r"app\.use\(`\$\{BASE\}/api/([^`]+)`, (\w+)Router\)", content)
    for path, router_name in matches:
        mounts[router_name] = path

    import_matches = re.findall(r"import (\w+)Router from \"\./routes/([^.]+)\.js\";", content)
    router_file_map = {name: file + ".js" for name, file in import_matches}
    
    # Also find top-level API routes in server.js
    server_matches = re.findall(r"app\.(get|post|put|delete|patch|use)\([`'\"](.*?)[`'\"]", content)
    for method, path in server_matches:
        if "/api/" in path:
            path = path.split("/api/")[1]
            backend_routes.append({"file": "server.js", "method": method.upper(), "path": "/" + path})

resolved_routes = []
for r in backend_routes:
    if r["file"] == "server.js":
        resolved_routes.append(r)
        continue
        
    router_name = None
    for name, file in router_file_map.items():
        if file == r["file"]:
            router_name = name
            break
            
    if router_name and router_name in mounts:
        prefix = "/" + mounts[router_name]
        path = r["path"]
        if path == "/":
            full_path = prefix
        else:
            full_path = prefix + path
        resolved_routes.append({"file": r["file"], "method": r["method"], "path": full_path})

# Now extract frontend API calls
frontend_apis = []
with open(app_file, "r", encoding="utf-8") as f:
    content = f.read()
    
    # regex to match get<something>("/path") or get(`/path`) or get("/path")
    # let's be more lenient: (get|post|put|patch|del)(?:<[^>]+>)?\s*\(\s*([`'"])(.*?)\2
    matches = re.findall(r"(get|post|put|patch|del)(?:<[^>]*>)?\s*\(\s*([`'\"])(.*?)\2", content)
    for method, _, path in matches:
        actual_method = method.upper()
        if actual_method == "DEL":
            actual_method = "DELETE"
        
        # remove query string if present
        path = path.split("?")[0]
        # remove dynamic parts formatting like ${...}
        path = re.sub(r"\$\{[^}]+\}", "*", path)
        frontend_apis.append({"method": actual_method, "path": path})

with open("api_audit.json", "w") as f:
    json.dump({"backend": resolved_routes, "frontend": frontend_apis}, f, indent=2)

print(f"Backend routes: {len(resolved_routes)}")
print(f"Frontend calls: {len(frontend_apis)}")

# Now let's compare them
print("\n--- Unmatched Frontend Calls (No corresponding backend endpoint) ---")
# normalize paths for comparison
def normalize_path(path):
    # replace :id or * with *
    p = re.sub(r":\w+", "*", path)
    return p.rstrip("/")

backend_set = set()
for r in resolved_routes:
    backend_set.add(f"{r['method']} {normalize_path(r['path'])}")

unmatched_frontend = []
for r in frontend_apis:
    norm_path = normalize_path(r['path'])
    if f"{r['method']} {norm_path}" not in backend_set:
        unmatched_frontend.append(f"{r['method']} {norm_path}")

for f in set(unmatched_frontend):
    print(f)
    
print("\n--- Unmatched Backend Endpoints (No corresponding frontend call) ---")
frontend_set = set()
for r in frontend_apis:
    frontend_set.add(f"{r['method']} {normalize_path(r['path'])}")

unmatched_backend = []
for r in resolved_routes:
    norm_path = normalize_path(r['path'])
    if f"{r['method']} {norm_path}" not in frontend_set:
        unmatched_backend.append(f"{r['method']} {norm_path} ({r['file']})")

for b in set(unmatched_backend):
    print(b)
