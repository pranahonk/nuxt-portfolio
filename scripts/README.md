# Image Optimization Script Usage Guide

## Overview
The `optimize_images.py` script optimizes JPG and PNG files to reduce their size while maintaining quality. It uses the Pillow library for image processing and provides various options for customization.

## Prerequisites
- Python 3.x installed
- The script will automatically install Pillow if it's not available

## How to Run

### 1. Navigate to the project directory
```bash
cd /Volumes/TEAM-SSD/WebstormProjects/nuxt-portfolio
```

### 2. Basic Usage (Recommended)
Run with default settings (85% quality, creates backups):
```bash
python3 scripts/optimize_images.py
```

### 3. Preview Mode (Dry Run)
See what would be optimized without making changes:
```bash
python3 scripts/optimize_images.py --dry-run
```

### 4. Advanced Usage Options

#### Optimize with custom quality (1-100, higher = better quality):
```bash
python3 scripts/optimize_images.py --quality 90
```

#### Optimize without creating backups:
```bash
python3 scripts/optimize_images.py --no-backup
```

#### Optimize specific directory:
```bash
python3 scripts/optimize_images.py --directory /path/to/your/images
```

#### Optimize only specific file types:
```bash
python3 scripts/optimize_images.py --extensions .jpg .png
```

#### Combine options:
```bash
python3 scripts/optimize_images.py --quality 90 --no-backup --dry-run
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--directory` | `-d` | Directory containing images | `/public/images/portfolio` |
| `--quality` | `-q` | JPEG quality (1-100) | 85 |
| `--no-backup` | | Skip creating backup files | Creates backups |
| `--extensions` | | File extensions to process | `.jpg .jpeg .png` |
| `--dry-run` | | Preview mode only | Performs optimization |

## Output Example
```
Image Optimization Script
========================
Directory: /path/to/images
Quality: 85
Extensions: .jpg, .jpeg, .png
Backup: Yes
Mode: Live

Found 35 image(s) to optimize:
  Screenshot_2025-07-21_at_12.38.21.png (6.5 MB)
  Untitled 9.png (2.2 MB)
  ...

[1/35] Processing Screenshot_2025-07-21_at_12.38.21.png...
  Backup created: /path/to/images/backups/Screenshot_2025-07-21_at_12.38.21.png
  Optimized: 6.5 MB → 3.2 MB (saved 50.8%)

Optimization Summary
===================
Images processed: 35
Successful optimizations: 35
Failed optimizations: 0
Total size before: 18.2 MB
Total size after: 9.8 MB
Total saved: 8.4 MB (46.2%)
```

## Safety Features
- **Automatic backups**: Original files are saved to a `backups` folder by default
- **Error handling**: Script continues processing even if individual files fail
- **Dry run mode**: Preview changes before applying them
- **Quality preservation**: Uses optimized compression while maintaining visual quality

## Troubleshooting

### If you get a "Pillow not found" error:
The script will automatically try to install Pillow. If it fails, install manually:
```bash
pip3 install Pillow
```

### If you get permission errors:
Make sure the script is executable:
```bash
chmod +x scripts/optimize_images.py
```

### If optimization doesn't seem to work:
- Check that the directory path is correct
- Ensure you have write permissions to the image directory
- Try running with `--dry-run` first to see what would be processed

## After Optimization
1. Check your optimized images to ensure quality is acceptable
2. Test your website to confirm images load correctly
3. If satisfied, you can delete the backup folder to save space:
   ```bash
   rm -rf /path/to/images/backups
   ```
