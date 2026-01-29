import os
import json
import sys

def check_package_managers():
    errors = []
    # Files to ignore
    ignored_dirs = {'node_modules', '.git', '.yarn', 'build', 'dist', '.next'}

    for root, dirs, files in os.walk('.'):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in ignored_dirs]

        # Check for forbidden lockfiles
        if 'package-lock.json' in files:
            errors.append(f"Forbidden file found: {os.path.join(root, 'package-lock.json')}")
        if 'pnpm-lock.yaml' in files:
            errors.append(f"Forbidden file found: {os.path.join(root, 'pnpm-lock.yaml')}")

        # Check package.json
        if 'package.json' in files:
            pkg_path = os.path.join(root, 'package.json')
            try:
                with open(pkg_path, 'r') as f:
                    data = json.load(f)
                    pm = data.get('packageManager')
                    if pm != 'yarn@4.12.0':
                        errors.append(f"Invalid packageManager in {pkg_path}: expected 'yarn@4.12.0', found {repr(pm)}")
            except Exception as e:
                errors.append(f"Error reading {pkg_path}: {e}")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    else:
        print("Package manager validation successful: All projects use yarn@4.12.0 and no forbidden lockfiles found.")

if __name__ == "__main__":
    check_package_managers()
