#!/usr/bin/env python3
import os
import platform
import subprocess
import argparse
import shutil
from pathlib import Path

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Build the project using CMake")
    parser.add_argument("--clean", action="store_true", help="Clean build directory before building")
    parser.add_argument("--release", action="store_true", help="Build in Release mode (default is Debug)")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    # Detect OS
    system = platform.system()
    print(f"Detected OS: {system}")

    # Set build type
    build_type = "Release" if args.release else "Debug"
    print(f"Building in {build_type} mode")

    # Get project root (assuming this script is in a scripts directory at project root)
    script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    project_root = script_dir.parent
    
    # Set build directory
    build_dir = project_root / "build" / build_type.lower()
    
    # Clean if requested
    if args.clean and build_dir.exists():
        print(f"Cleaning build directory: {build_dir}")
        shutil.rmtree(build_dir)
    
    # Create build directory if it doesn't exist
    build_dir.mkdir(parents=True, exist_ok=True)
    
    # Set platform specific generator
    generator = None
    if system == "Windows":
        generator = "Visual Studio 17 2022"  # Adjust according to your VS version
    elif system == "Darwin" or system == "Linux":
        generator = "Unix Makefiles"
        
    # Configure cmake command
    cmake_config_cmd = ["cmake", "-S", str(project_root), "-B", str(build_dir)]
    
    if generator:
        cmake_config_cmd.extend(["-G", generator])
    
    cmake_config_cmd.extend(["-DCMAKE_BUILD_TYPE=" + build_type])
    
    # Configure the project
    print("Configuring CMake project...")
    if args.verbose:
        print(f"Running: {' '.join(cmake_config_cmd)}")
    
    result = subprocess.run(cmake_config_cmd)
    if result.returncode != 0:
        print("CMake configuration failed")
        return 1
    
    # Build the project
    print("Building project...")
    build_cmd = ["cmake", "--build", str(build_dir), "--config", build_type]
    
    # Set parallel build
    if system == "Windows":
        build_cmd.extend(["--parallel", str(os.cpu_count() or 2)])
    elif system == "Darwin" or system == "Linux":
        build_cmd.extend(["--", f"-j{os.cpu_count() or 2}"])
    
    if args.verbose:
        print(f"Running: {' '.join(build_cmd)}")
    
    result = subprocess.run(build_cmd)
    if result.returncode != 0:
        print("Build failed")
        return 1
    
    print(f"Build completed successfully in {build_type} mode")
    print(f"Build artifacts can be found in: {build_dir}")
    return 0

if __name__ == "__main__":
    exit(main())
