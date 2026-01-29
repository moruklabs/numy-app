#!/usr/bin/env python3
"""
Tests for pre_tool_use.py hook functionality.

Run with: python3 test_pre_tool_use.py
"""

import json
import os
import sys
import subprocess
from pathlib import Path


def run_hook_test(tool_name: str, tool_input: dict) -> tuple[int, str, str]:
    """
    Run the pre_tool_use hook with given input and return exit code and output.
    
    Returns:
        (exit_code, stdout, stderr)
    """
    test_input = json.dumps({
        'tool_name': tool_name,
        'tool_input': tool_input
    })
    
    hook_path = Path(__file__).parent / 'pre_tool_use.py'
    
    # Use uv run to execute the script with its dependencies
    result = subprocess.run(
        ['uv', 'run', '--script', str(hook_path)],
        input=test_input,
        capture_output=True,
        text=True,
        env=(lambda: (
            (lambda env: env.update({'PATH': '/home/runner/.local/bin:' + env.get('PATH', '')}) or env)
            (os.environ.copy())
        ) if os.environ.get('CI') or os.environ.get('GITHUB_ACTIONS') else os.environ.copy())()
    )
    
    return result.returncode, result.stdout, result.stderr


def test_gitignored_file_removal():
    """Test that gitignored files can be removed."""
    print("Testing gitignored file removal...")
    
    # Test .next/cache/webpack/ which is gitignored
    exit_code, stdout, stderr = run_hook_test(
        'Bash',
        {'command': 'rm -rf .next/cache/webpack/'}
    )
    
    if exit_code == 0:
        print("✓ PASS: .next/cache/webpack/ removal allowed")
        return True
    else:
        print(f"✗ FAIL: .next/cache/webpack/ removal blocked (exit: {exit_code})")
        print(f"  stderr: {stderr}")
        return False


def test_gitignored_dir_removal():
    """Test that gitignored directories can be removed."""
    print("Testing gitignored directory removal...")
    
    test_cases = [
        'rm -rf node_modules/',
        'rm -rf .next/',
        'rm -rf outputs/',
        'rm -rf logs/',
        'rm -rf .turbo/',
    ]
    
    all_passed = True
    for cmd in test_cases:
        exit_code, stdout, stderr = run_hook_test('Bash', {'command': cmd})
        
        if exit_code == 0:
            print(f"✓ PASS: '{cmd}' allowed")
        else:
            print(f"✗ FAIL: '{cmd}' blocked (exit: {exit_code})")
            print(f"  stderr: {stderr}")
            all_passed = False
    
    return all_passed


def test_tracked_file_protection():
    """Test that tracked files are still protected."""
    print("Testing tracked file protection...")
    
    # Test some files that should NOT be removed
    test_cases = [
        'rm -rf package.json',
        'rm -rf src/',
        'rm -rf lib/',
        'rm -rf README.md',
    ]
    
    all_passed = True
    for cmd in test_cases:
        exit_code, stdout, stderr = run_hook_test('Bash', {'command': cmd})
        
        if exit_code == 2:  # Should be blocked
            print(f"✓ PASS: '{cmd}' correctly blocked")
        else:
            print(f"✗ FAIL: '{cmd}' should be blocked but exit code was {exit_code}")
            all_passed = False
    
    return all_passed


def test_dangerous_paths_still_blocked():
    """Test that dangerous system paths are still blocked."""
    print("Testing dangerous path protection...")
    
    test_cases = [
        'rm -rf /',
        'rm -rf ~/',
        'rm -rf $HOME',
        'rm -rf ..',
        'rm -rf *',
        'rm -rf .',
    ]
    
    all_passed = True
    for cmd in test_cases:
        exit_code, stdout, stderr = run_hook_test('Bash', {'command': cmd})
        
        if exit_code == 2:  # Should be blocked
            print(f"✓ PASS: '{cmd}' correctly blocked")
        else:
            print(f"✗ FAIL: '{cmd}' should be blocked but exit code was {exit_code}")
            all_passed = False
    
    return all_passed


def test_env_file_protection():
    """Test that .env file protection still works."""
    print("Testing .env file protection...")
    
    # Test .env access should be blocked
    exit_code, stdout, stderr = run_hook_test(
        'Bash',
        {'command': 'cat .env'}
    )
    
    if exit_code == 2:
        print("✓ PASS: .env access correctly blocked")
        return True
    else:
        print(f"✗ FAIL: .env access should be blocked but exit code was {exit_code}")
        return False


def test_mixed_targets():
    """Test commands with both gitignored and tracked files."""
    print("Testing mixed target commands...")
    
    # Command with both gitignored and tracked files should be blocked
    exit_code, stdout, stderr = run_hook_test(
        'Bash',
        {'command': 'rm -rf node_modules/ package.json'}
    )
    
    if exit_code == 2:
        print("✓ PASS: Mixed target command correctly blocked")
        return True
    else:
        print(f"✗ FAIL: Mixed target should be blocked but exit code was {exit_code}")
        return False


def test_various_rm_formats():
    """Test various rm command formats with gitignored files."""
    print("Testing various rm command formats...")
    
    test_cases = [
        'rm -rf .next/cache/webpack/',
        'rm -r -f .next/cache/webpack/',
        'rm -fr .next/cache/webpack/',
        'rm --recursive --force .next/cache/webpack/',
        'rm --force --recursive .next/cache/webpack/',
    ]
    
    all_passed = True
    for cmd in test_cases:
        exit_code, stdout, stderr = run_hook_test('Bash', {'command': cmd})
        
        if exit_code == 0:
            print(f"✓ PASS: '{cmd}' allowed")
        else:
            print(f"✗ FAIL: '{cmd}' blocked (exit: {exit_code})")
            print(f"  stderr: {stderr}")
            all_passed = False
    
    return all_passed


def main():
    """Run all tests."""
    print("=" * 60)
    print("Running pre_tool_use.py hook tests")
    print("=" * 60)
    print()
    
    tests = [
        test_gitignored_file_removal,
        test_gitignored_dir_removal,
        test_tracked_file_protection,
        test_dangerous_paths_still_blocked,
        test_env_file_protection,
        test_mixed_targets,
        test_various_rm_formats,
    ]
    
    results = []
    for test in tests:
        print()
        result = test()
        results.append(result)
        print()
    
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    for i, (test, result) in enumerate(zip(tests, results), 1):
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test.__name__}")
    
    print()
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
