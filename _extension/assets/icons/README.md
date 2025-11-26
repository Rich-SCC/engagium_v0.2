# Icon Placeholders

The extension requires the following icon files:
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

For MVP testing, you can use simple placeholder icons or generate them using:
- https://favicon.io/favicon-generator/
- https://realfavicongenerator.net/
- Any image editing tool

## Quick Placeholder Creation

Use this SVG as a base and export at different sizes:

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <text x="64" y="80" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">E</text>
</svg>
```

Save this as icon.svg and convert to PNG at required sizes.

## Temporary Workaround

For immediate testing, the extension will work without icons but Chrome will show a default puzzle piece icon.
