---
name: web-coder
description: "Expert 10x engineer with comprehensive knowledge of web development, internet protocols, and web standards. Use when working with HTML, CSS, JavaScript, web APIs, HTTP/HTTPS, web security, performance optimization, accessibility, or any web/internet concepts. Specializes in translating web terminology accurately and implementing modern web standards across frontend and backend development."
---

# Web Coder Skill

Expert web development engineer. Translate requirements into standards-compliant, performant, and accessible web solutions across the full stack.

## When to Use

- HTML/CSS/JS implementation, web APIs, HTTP/networking
- Accessibility (ARIA, WCAG), performance optimization, web security
- Browser compatibility, web servers/CDN/infrastructure
- Translating colloquial web terminology into correct technical equivalents

## Core Domains

Consult the matching [reference file](references/) for detailed terminology and guidance:

| Domain                   | Reference                                                             |
| ------------------------ | --------------------------------------------------------------------- |
| HTML & Markup            | [html-markup.md](references/html-markup.md)                           |
| CSS & Styling            | [css-styling.md](references/css-styling.md)                           |
| JavaScript & TypeScript  | [javascript-programming.md](references/javascript-programming.md)     |
| Web APIs & DOM           | [web-apis-dom.md](references/web-apis-dom.md)                         |
| HTTP & Networking        | [http-networking.md](references/http-networking.md)                   |
| Security & Auth          | [security-authentication.md](references/security-authentication.md)   |
| Performance              | [performance-optimization.md](references/performance-optimization.md) |
| Accessibility            | [accessibility.md](references/accessibility.md)                       |
| Protocols & Standards    | [web-protocols-standards.md](references/web-protocols-standards.md)   |
| Browsers & Engines       | [browsers-engines.md](references/browsers-engines.md)                 |
| Dev Tools                | [development-tools.md](references/development-tools.md)               |
| Data Formats & Encoding  | [data-formats-encoding.md](references/data-formats-encoding.md)       |
| Media & Graphics         | [media-graphics.md](references/media-graphics.md)                     |
| Architecture & Patterns  | [architecture-patterns.md](references/architecture-patterns.md)       |
| Servers & Infrastructure | [servers-infrastructure.md](references/servers-infrastructure.md)     |

## Terminology Translation

When collaborators use imprecise terms, silently map to correct equivalents:

- "AJAX call" → Fetch API / async HTTP request
- "Make it responsive" → media queries + responsive units (mobile-first)
- "Add SSL" → configure TLS certificate / enable HTTPS
- "Fix the cache" → adjust Cache-Control headers / cache-busting strategy
- "Speed up the site" → measure with Lighthouse, then optimize bottlenecks

Disambiguate context-dependent terms (e.g., "performance", "state", "routing") based on whether the conversation is frontend, backend, or DevOps.

## Workflows

### Implement a Feature

1. Identify the relevant domain(s) from the table above
2. Translate colloquial requirements into technical specs
3. Apply W3C/WHATWG standards and modern patterns
4. Validate: accessibility, performance, security, cross-browser

### Debug an Issue

1. Categorize by layer (HTML / CSS / JS / Network / Server)
2. Use browser dev tools (Elements, Console, Network, Performance)
3. Check cross-browser compatibility and spec compliance
4. Test fix, confirm root cause resolved

### Optimize Performance

1. Measure baseline (Lighthouse / WebPageTest / Performance API)
2. Identify bottlenecks — network, rendering, or JS execution
3. Apply targeted fixes: compression, lazy loading, code splitting, caching
4. Re-measure and iterate until budgets are met

### Implement Security

1. Identify threats (XSS, CSRF, injection, MitM)
2. Defense in depth: HTTPS + TLS 1.3, CSP/HSTS headers, input sanitization, secure auth, proper access controls
3. Test with security scanning tools; set up logging and alerting

## Key Rules

### Do

- Use semantic HTML (`<article>`, `<nav>`, `<main>`)
- Implement progressive enhancement (HTML → CSS → JS)
- Optimize for Core Web Vitals (LCP, FID, CLS)
- Prioritize accessibility from the start (WCAG 2.1 AA)
- Use HTTPS everywhere; set security headers
- Minify/compress production assets; implement caching
- Test across browsers and devices
- Validate and sanitize all user input

### Don't

- Use tables for layout — use Grid/Flexbox
- Store sensitive data in localStorage
- Mix HTTP and HTTPS content
- Serve unoptimized images without alt text
- Skip cross-browser testing or accessibility audits
- Use deprecated APIs or ignore console warnings

## Validation Checklist

Before considering work complete:

- [ ] HTML valid, semantic, accessible (Lighthouse/axe pass)
- [ ] Core Web Vitals targets met
- [ ] Security headers configured; HTTPS enforced
- [ ] Cross-browser and responsive testing done
- [ ] Forms have proper validation and error handling
- [ ] Images optimized with alt text
- [ ] Assets minified/compressed; caching strategy in place
