import os
import re

backend_endpoints = set()
frontend_endpoints = set()

# Parse backend
controller_dir = r"d:\accounting-desktop-app\src\main\java\com\accounting\app\controller"
class_mapping_re = re.compile(r'@RequestMapping\("([^"]+)"\)')
method_mapping_re = re.compile(r'@(Get|Post|Put|Delete)Mapping\((?:value\s*=\s*)?"([^"]*)"(?:.*)?\)')
default_method_mapping_re = re.compile(r'@(Get|Post|Put|Delete)Mapping(?:(?!\())') # no path specified

for root, _, files in os.walk(controller_dir):
    for f in files:
        if f.endswith('.java'):
            with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                content = file.read()
                
                base_path = ""
                class_match = class_mapping_re.search(content)
                if class_match:
                    base_path = class_match.group(1)
                
                lines = content.split('\n')
                for line in lines:
                    method_match = method_mapping_re.search(line)
                    if method_match:
                        method = method_match.group(1).upper()
                        sub_path = method_match.group(2)
                        if sub_path == "/": sub_path = ""
                        full_path = (base_path + sub_path).strip('/')
                        full_path = re.sub(r'\{[^}]+\}', '{}', full_path)
                        backend_endpoints.add(f"{method} /{full_path}")
                        continue
                    
                    if line.strip().startswith('@GetMapping') and '"' not in line:
                        backend_endpoints.add(f"GET /{base_path.strip('/')}")
                    elif line.strip().startswith('@PostMapping') and '"' not in line:
                        backend_endpoints.add(f"POST /{base_path.strip('/')}")
                    elif line.strip().startswith('@PutMapping') and '"' not in line:
                        backend_endpoints.add(f"PUT /{base_path.strip('/')}")
                    elif line.strip().startswith('@DeleteMapping') and '"' not in line:
                        backend_endpoints.add(f"DELETE /{base_path.strip('/')}")


# Parse frontend
frontend_dir = r"d:\accounting-desktop-app\frontend\src"
# Match axios.get("/api/...") or axios.post(`/api/...`)
# It handles strings with " or ' or `
axios_re = re.compile(r'axios\.(get|post|put|delete)\s*\(\s*([`\'"])(.*?)(?:\?[^`\'"]*)?\2')
# For template literals with variables, we'll try our best:
# /api/employees/${id} -> /api/employees/{}

for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                lines = file.read().split('\n')
                for i, line in enumerate(lines):
                    for match in axios_re.finditer(line):
                        method = match.group(1).upper()
                        url = match.group(3)
                        
                        # Strip query params correctly even if matched inside template string (sometimes matched weirdly)
                        url = url.split('?')[0]
                        
                        # Replace JS string interpolation ${...} with {}
                        url = re.sub(r'\$\%7B[^\%]+\%7D|\$\{[^}]+\}', '{}', url)
                        
                        # Clean up path
                        url = url.strip('/')
                        # In case url is something like `${baseUrl}` skip it or print warning
                        if not url.startswith('api/'):
                            # Check if line had baseUrl
                            if 'baseUrl' in line:
                                # hardcoded skip for dynamic baseUrl if possible, or print
                                pass
                            else:
                                print(f"Warning: Non-standard url found in {f}:{i+1} -> {url}")
                            continue

                        frontend_endpoints.add(f"{method} /{url}")


print("----- BACKEND ENDPOINTS -----")
for ep in sorted(backend_endpoints):
    print(ep)

print("\n----- FRONTEND ENDPOINTS -----")
for ep in sorted(frontend_endpoints):
    print(ep)
                        
print("\n----- MISSING IN BACKEND -----")
for ep in sorted(frontend_endpoints):
    if ep not in backend_endpoints:
        print(f"!!! NOT IN BACKEND: {ep}")

