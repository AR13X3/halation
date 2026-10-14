# Security policy

## Supported versions

Security fixes are made on `main` and shipped in the next release. The [online app](https://ar13x3.github.io/halation/) always runs the latest `main`.

| Version | Supported |
| --- | --- |
| 1.1.x (latest) | Yes |
| Older releases | No, please update |

## Reporting a vulnerability

**Please don't open a public issue for security problems.**

Report them privately through GitHub: go to the repository's **[Security](https://github.com/AR13X3/halation/security)** tab and choose **Report a vulnerability**. Only you and the maintainer can see the report.

Helpful details:

- What the issue is and what an attacker could do with it
- Steps or a minimal file, share link or URL that reproduces it
- The browser, operating system and Halation version you tested

You can expect an acknowledgement within a week. Once the issue is confirmed, a fix will be prepared and released as soon as practical, and you'll be credited in the release notes unless you'd rather not be.

## Scope

Halation is a static web app that runs entirely in the browser. It has no server, no accounts and doesn't upload anything you make. Relevant reports include:

- Script injection or other unexpected behavior from a crafted **share link**, imported **looks file** (`.json`) or **image**
- Anything that sends your data off your device
- Path traversal or similar issues in the development server (`tools/serve.mjs`), which is meant for local use only

Out of scope:

- A browser or GPU driver that slows down, hangs or crashes on heavy settings. Please report these as [bugs](https://github.com/AR13X3/halation/issues/new?template=bug_report.md) instead.
- GitHub Pages hosting configuration and headers, which are managed by GitHub
