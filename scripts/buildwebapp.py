import subprocess
import shutil
import os
from pathlib import Path

def build_and_zip():
    # Create tmp directory if it doesn't exist
    tmp_dir = Path('./tmp')
    tmp_dir.mkdir(exist_ok=True)

    # Run pnpm build
    print("Running pnpm build...")
    subprocess.run(['pnpm', 'build'], check=True)

    # Create zip file from dist directory
    print("Creating zip archive...")
    if os.path.exists('./tmp/app.zip'):
        os.remove('./tmp/app.zip')
    
    shutil.make_archive('./tmp/app', 'zip', './dist')
    print("Build and zip completed: ./tmp/app.zip")

if __name__ == '__main__':
    build_and_zip()