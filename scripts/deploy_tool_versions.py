import os

tool_versions_content = """nodejs 25.2.1
yarn 4.12.0
ruby 3.4.7
java temurin-17.0.9+9
"""

def create_tool_versions(path):
    tv_path = os.path.join(path, ".tool-versions")
    with open(tv_path, 'w') as f:
        f.write(tool_versions_content)
    print(f"Created .tool-versions in {path}")

# Root
create_tool_versions(".")

# Find all directories with package.json
for root, dirs, files in os.walk("."):
    # Skip common noise
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".git" in dirs:
        dirs.remove(".git")
    if ".expo" in dirs:
        dirs.remove(".expo")
    
    if "package.json" in files:
        create_tool_versions(root)

