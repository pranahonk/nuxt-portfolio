#!/usr/bin/env python3
"""
Image Optimization Script for Nuxt Portfolio
Optimizes JPG and PNG files to reduce their size while maintaining quality.
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
from typing import List, Tuple
import argparse

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        from PIL import Image, ImageOps
        return True, None
    except ImportError:
        return False, "Pillow library not found. Please install it with: pip3 install Pillow"

def install_pillow():
    """Attempt to install Pillow automatically."""
    try:
        print("Installing Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        return True
    except subprocess.CalledProcessError:
        return False

def get_file_size(filepath: Path) -> int:
    """Get file size in bytes."""
    return filepath.stat().st_size

def format_size(size_bytes: int) -> str:
    """Format size in bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def create_backup(filepath: Path, backup_dir: Path) -> Path:
    """Create a backup of the original file."""
    backup_dir.mkdir(exist_ok=True)
    backup_path = backup_dir / filepath.name
    shutil.copy2(filepath, backup_path)
    return backup_path

def optimize_image(filepath: Path, quality: int = 85, backup: bool = True) -> Tuple[bool, str, int, int]:
    """
    Optimize a single image file.

    Args:
        filepath: Path to the image file
        quality: JPEG quality (1-100, higher = better quality)
        backup: Whether to create a backup

    Returns:
        Tuple of (success, message, original_size, new_size)
    """
    try:
        from PIL import Image, ImageOps

        original_size = get_file_size(filepath)

        # Create backup if requested
        if backup:
            backup_dir = filepath.parent / 'backups'
            backup_path = create_backup(filepath, backup_dir)
            print(f"  Backup created: {backup_path}")

        # Open and optimize the image
        with Image.open(filepath) as img:
            # Convert RGBA to RGB for JPEG if necessary
            if filepath.suffix.lower() == '.jpg' or filepath.suffix.lower() == '.jpeg':
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create a white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background

            # Apply auto-orientation based on EXIF data
            img = ImageOps.exif_transpose(img)

            # Optimize and save
            optimize_params = {
                'optimize': True,
                'quality': quality
            }

            if filepath.suffix.lower() == '.png':
                # For PNG, use different optimization
                optimize_params = {
                    'optimize': True,
                    'compress_level': 6  # 0-9, higher = more compression
                }

            # Save optimized image
            img.save(filepath, **optimize_params)

        new_size = get_file_size(filepath)
        saved_bytes = original_size - new_size
        saved_percent = (saved_bytes / original_size) * 100 if original_size > 0 else 0

        message = f"Optimized: {format_size(original_size)} → {format_size(new_size)} (saved {saved_percent:.1f}%)"

        return True, message, original_size, new_size

    except Exception as e:
        return False, f"Error optimizing {filepath}: {str(e)}", original_size, original_size

def find_images(directory: Path, extensions: List[str] = None) -> List[Path]:
    """Find all image files in the directory."""
    if extensions is None:
        extensions = ['.jpg', '.jpeg', '.png']

    images = []
    for ext in extensions:
        images.extend(directory.glob(f"*{ext}"))
        images.extend(directory.glob(f"*{ext.upper()}"))

    return sorted(images)

def main():
    parser = argparse.ArgumentParser(description='Optimize JPG and PNG images in portfolio')
    parser.add_argument('--directory', '-d',
                       default='/Volumes/TEAM-SSD/WebstormProjects/nuxt-portfolio/public/images/portfolio',
                       help='Directory containing images to optimize')
    parser.add_argument('--quality', '-q', type=int, default=85,
                       help='JPEG quality (1-100, default: 85)')
    parser.add_argument('--no-backup', action='store_true',
                       help='Skip creating backup files')
    parser.add_argument('--extensions', nargs='+', default=['.jpg', '.jpeg', '.png'],
                       help='File extensions to process')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be optimized without making changes')

    args = parser.parse_args()

    # Check dependencies
    has_pillow, error_msg = check_dependencies()
    if not has_pillow:
        print(f"Error: {error_msg}")
        print("Attempting to install Pillow automatically...")
        if install_pillow():
            print("Pillow installed successfully!")
            has_pillow, error_msg = check_dependencies()
            if not has_pillow:
                print(f"Still having issues: {error_msg}")
                sys.exit(1)
        else:
            print("Failed to install Pillow automatically.")
            print("Please install it manually with: pip3 install Pillow")
            sys.exit(1)

    directory = Path(args.directory)
    if not directory.exists():
        print(f"Error: Directory {directory} does not exist")
        sys.exit(1)

    print(f"Image Optimization Script")
    print(f"========================")
    print(f"Directory: {directory}")
    print(f"Quality: {args.quality}")
    print(f"Extensions: {', '.join(args.extensions)}")
    print(f"Backup: {'No' if args.no_backup else 'Yes'}")
    print(f"Mode: {'Dry run' if args.dry_run else 'Live'}")
    print()

    # Find images
    images = find_images(directory, args.extensions)

    if not images:
        print("No images found to optimize.")
        return

    print(f"Found {len(images)} image(s) to optimize:")
    for img in images:
        size = format_size(get_file_size(img))
        print(f"  {img.name} ({size})")
    print()

    if args.dry_run:
        print("Dry run complete. Use --dry-run=false to perform actual optimization.")
        return

    # Optimize images
    total_original_size = 0
    total_new_size = 0
    successful_optimizations = 0

    for i, image_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] Processing {image_path.name}...")

        success, message, original_size, new_size = optimize_image(
            image_path,
            quality=args.quality,
            backup=not args.no_backup
        )

        print(f"  {message}")

        if success:
            successful_optimizations += 1
            total_original_size += original_size
            total_new_size += new_size

        print()

    # Summary
    print("Optimization Summary")
    print("===================")
    print(f"Images processed: {len(images)}")
    print(f"Successful optimizations: {successful_optimizations}")
    print(f"Failed optimizations: {len(images) - successful_optimizations}")

    if total_original_size > 0:
        total_saved = total_original_size - total_new_size
        total_saved_percent = (total_saved / total_original_size) * 100
        print(f"Total size before: {format_size(total_original_size)}")
        print(f"Total size after: {format_size(total_new_size)}")
        print(f"Total saved: {format_size(total_saved)} ({total_saved_percent:.1f}%)")

    if not args.no_backup:
        backup_dir = directory / 'backups'
        print(f"\nBackup files stored in: {backup_dir}")
        print("You can safely delete the backup directory after verifying the optimized images.")

if __name__ == "__main__":
    main()
