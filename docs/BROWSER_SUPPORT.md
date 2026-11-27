# Browser Support

HackSpace supports **Google Chrome** (the required browser) and two additional browsers: **Mozilla Firefox** and **Brave**.

| Browser | Minimum version | Tested with |
|---|---|---|
| Chrome | 111 | Chromium 159 (Chrome's engine) |
| Firefox | 128 | Firefox 159 |
| Brave | 1.52 | Brave 1.100 (Chromium 158), default Shields |

The minimums come from the CSS features used by Tailwind v4 (`oklch()`, `color-mix()`, `:has()`, container queries).

## What was tested

Every page and feature, at desktop (1366 px) and mobile (390 px) widths: sign up and OTP, login and logout, OAuth redirect, profile and avatar, friends, hackathon create, edit and list, teams, join requests, live chat, and file upload and download. Pages render the same in all three browsers, and no browser-specific bug was found.

## Differences between browsers

| Browser | Difference | Impact |
|---|---|---|
| Firefox | Date/time fields use Firefox's own picker. Number fields always show their arrows. | Looks different, works the same. |
| Brave | None found. Its default Shields (ad and tracker blocking) didn't block anything the app needs. | Same as Chrome. |

## Testing it yourself

1. Open `https://localhost:8443` and accept the local certificate warning (once per browser).
2. Log in, go through the main pages, and check that the layout holds and DevTools shows no errors.
