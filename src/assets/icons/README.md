# Extension Icons

This directory should contain the following icon files:

- `icon16.png` - 16x16px (for favicon/toolbar)
- `icon32.png` - 32x32px (for toolbar)
- `icon48.png` - 48x48px (for extension management)
- `icon128.png` - 128x128px (for Chrome Web Store)

## Creating Icons

You can create your own icons or use online tools:

1. **Design Tool**: Use Figma, Canva, or Photoshop
2. **Online Generators**:
   - [Icon Kitchen](https://icon.kitchen/)
   - [Make App Icon](https://makeappicon.com/)
   - [App Icon Generator](https://appicon.co/)

## Temporary Workaround

For testing purposes, you can:

1. Use a placeholder generator:
   ```bash
   # Create simple colored squares (requires ImageMagick)
   convert -size 16x16 xc:#1a73e8 icon16.png
   convert -size 32x32 xc:#1a73e8 icon32.png
   convert -size 48x48 xc:#1a73e8 icon48.png
   convert -size 128x128 xc:#1a73e8 icon128.png
   ```

2. Or download free icons from:
   - [Flaticon](https://www.flaticon.com/)
   - [Icons8](https://icons8.com/)
   - [The Noun Project](https://thenounproject.com/)

## Icon Design Suggestions

- Use YouTube red (#FF0000) or blue (#1a73e8)
- Include a play button or feed icon
- Keep it simple and recognizable
- Ensure it works at small sizes (16px)

## Note

The extension will fail to load without these icons. Either create proper icons or temporarily remove the `icons` section from `manifest.json` for testing.
