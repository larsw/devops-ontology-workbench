# Offline/Isolated Network Setup Guide

This document outlines how the DevOps Ontology Workbench has been configured to work in isolated/on-premise networks without external dependencies.

## Changes Made for Offline Support

### 1. Yasgui Dependencies
- **Before**: Used CDN links for `@triply/yasgui`
  ```html
  <script src="https://unpkg.com/@triply/yasgui/build/yasgui.min.js"></script>
  <link href="https://unpkg.com/@triply/yasgui/build/yasgui.min.css" rel="stylesheet" />
  ```

- **After**: Uses local NPM packages from Zazuko fork
  ```typescript
  import Yasgui from '@zazuko/yasgui';
  import Yasr from '@zazuko/yasr';
  import '@zazuko/yasgui/build/yasgui.min.css';
  ```

### 2. Package Dependencies
All external dependencies are now bundled locally:

```json
{
  "dependencies": {
    "@zazuko/yasgui": "^4.5.0",
    "@zazuko/yasr": "^4.5.0", 
    "@zazuko/yasqe": "^4.5.0",
    "d3": "^7.9.0",
    "n3": "^1.26.0"
  }
}
```

### 3. Build Process
- Vite bundles all dependencies into the final build
- No runtime CDN requests
- All assets are self-contained in the `/dist` folder

## Deployment for Isolated Networks

### Prerequisites
1. Node.js/Bun runtime (for build process)
2. All NPM packages installed locally

### Build Process
```bash
# Install dependencies (do this on a connected machine)
bun install

# Build for production
bun run build

# The dist/ folder contains everything needed for deployment
```

### Network Isolation Verification
The built application in `/dist` contains:
- All JavaScript bundled into `index-*.js`
- All CSS bundled into `index-*.css` 
- No external network requests
- Self-contained HTML file

### Deployment Options

#### Option 1: Static File Server
```bash
# Serve the dist folder with any static file server
cd dist
python -m http.server 8080
# or
npx serve .
```

#### Option 2: Docker (Recommended)
```bash
# Use the provided Dockerfile
docker build -t devops-workbench-frontend .
docker run -p 3000:80 devops-workbench-frontend
```

#### Option 3: Nginx/Apache
Copy the `/dist` folder contents to your web server's document root.

## Potential External Dependencies to Watch

While the application is designed to be fully offline, be aware of these potential issues:

### 1. Font Loading
- Currently uses system fonts (`'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`)
- No external font CDNs

### 2. Icon Dependencies
- All icons are inline SVG or Unicode characters
- No external icon libraries

### 3. Yasgui Internal Dependencies
- Yasgui itself might try to load external resources
- Monitor network traffic to identify any missed dependencies

## Testing Offline Functionality

### 1. Network Disconnection Test
```bash
# Build and serve locally
bun run build
cd dist
python -m http.server 8080

# Disconnect from internet and test functionality
```

### 2. Docker Isolation Test
```bash
# Build with no network access
docker build --network=none -t test-offline .
```

### 3. Firewall Rules Test
Set up firewall rules to block all outbound traffic and verify the application works.

## Troubleshooting

### If External Requests Are Detected
1. Check browser developer tools Network tab
2. Look for failed requests to external domains
3. Common culprits:
   - Font loading from Google Fonts
   - JavaScript libraries making API calls
   - CSS importing external resources

### Missing Dependencies
If you see errors about missing modules:
```bash
# Check for any CDN references in HTML
grep -r "cdn\|unpkg\|jsdelivr" src/

# Check for external URLs in CSS
grep -r "http" *.css

# Verify all imports are local
grep -r "import.*http" src/
```

## Security Considerations

### Content Security Policy
For maximum security in isolated environments, add CSP headers:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
```

Note: `unsafe-eval` is required for Yasgui's internal functionality.

### Network Monitoring
Set up monitoring to alert on any outbound network requests:
```bash
# Monitor network traffic
tcpdump -i any 'not host localhost and not host 127.0.0.1'
```

## Future Maintenance

When updating dependencies:
1. Test in isolated environment
2. Check for new external dependencies
3. Verify build size remains reasonable
4. Test all functionality without network access

## Current Status ✅

- ✅ Yasgui converted to local NPM packages
- ✅ All CDN references removed  
- ✅ Build produces self-contained assets
- ✅ No runtime external requests
- ✅ Docker support for isolated deployment
- ⚠️ Custom Yasgui plugins temporarily disabled (need adaptation for Zazuko fork)
