# Launch Plan — 10-Day Sequence

---

## Audiences

| ID | Who | What they care about |
|----|-----|----------------------|
| A | Recruiters / hiring managers | Claude Code in a real project; shipping discipline; portfolio signal |
| B | Senior React Native / Expo devs | Technical decisions: token architecture, CNG approach, LLM reliability patterns |
| C | Agency CTOs / engineering leads | White-label ROI; how long a new client brand actually takes; CI gate coverage |

---

## Day-by-day plan

| Day | Channel | Asset | Goal | Reaches |
|-----|---------|-------|------|---------|
| 1 | GitHub | Make repo public; update README badges with real URLs | Source of truth live before anything else goes out | B, C |
| 1 | LinkedIn | Primary launch post (draft below) | First impressions from professional network | A, C |
| 1 | X (Twitter) | Same core post, compressed to thread (4 tweets max); link to repo | Reach RN/Expo dev community | B |
| 2 | r/reactnative | Technical post: lead with the contrast-gate pattern, not the product (draft notes below) | Credibility with senior RN devs; avoid "self-promo" removal | B |
| 3 | Expo Discord #show-and-tell | Short message + repo link + one screenshot of the contrast table | Direct Expo community; async feedback | B |
| 4–5 | Personal blog | Full blog post published (use outline in `blog-outline.md`) | Long-form SEO; link target for future posts | B, C |
| 4–5 | dev.to | Cross-post blog post with canonical URL pointing back to personal blog | Discoverability; dev.to audience skews React/RN | B |
| 4–5 | Repo README | Add blog post link under "How it works" | Reduces bounce for people who want depth | B, C |
| 6 | LinkedIn | Follow-up post: one hard problem deep-dive — the vision-model cross-check (draft below) | Show technical depth; reach people who missed day 1 | A, B |
| 8 | r/ExperiencedDevs or HN Show HN | **Judgment call: only post if repo has meaningful stars/engagement by day 7.** If yes: HN Show HN format — one sentence what it does, one sentence what's technically interesting. If no: skip and note in retro why. | Senior generalist engineers; potential contributors | B, C |
| 10 | GitHub | Pin repo on profile | Permanent discoverability for profile visitors | A |
| 10 | LinkedIn | Retro post: what the numbers looked like, one honest observation about the 14-phase build approach | Close the launch arc; signal authenticity | A, C |

---

## LinkedIn post drafts

### Day 1 — Primary launch post

Hook must be the first line; LinkedIn truncates after two lines before "see more."

---

I spent the last few weeks building a React Native app that re-brands itself
from a logo file.

Drop in a logo. One command later: brand.json with WCAG-validated colors, app
icons, splash screen, DE and EN store copy, framed screenshots, and a green CI
run. The app boots under the new identity immediately.

The technical part that took the most iteration: getting an LLM to produce
reliable color palettes. The answer wasn't better prompts — it was constraining
the LLM to 7 seed colors and running a deterministic cross-check against the
actual pixel data. The LLM only has to be roughly right; a contrast gate handles
the rest.

The build itself was phased: 14 Claude Code sessions, one per feature boundary.
Heavy-handed for a side project. Worth it for keeping the AI in its lane across
a month of work.

Repo link in the comments.

3 hashtags max: #ReactNative #TypeScript #ClaudeCode

CTA: Repo is in the comments.

**Reaches:** A, C

---

### Day 6 — Deep-dive follow-up post

---

Follow-up on the app factory I shared earlier this week. One specific problem
worth explaining: how do you trust a vision model's color output?

The naive approach: ask the LLM to return hex colors and use them. The problem:
LLMs hallucinate hex values that look plausible but aren't in the image —
especially on logos with anti-aliasing or gradients rasterized on white.

What I did instead: run two extractions in parallel. The LLM picks the primary
from the logo. Sharp quantizes the rasterized image and returns dominant pixel
clusters. If the LLM's pick isn't within ΔE tolerance of any dominant cluster,
the deterministic candidate wins.

Neither method is authoritative alone. Two agreeing is the signal.

This adds one Sharp call per factory run (~200ms). It has prevented several
off-palette submissions in testing.

Full write-up in the blog post linked in the comments.

3 hashtags max: #MachineLearning #ReactNative #ClaudeCode

CTA: Blog post in the comments.

**Reaches:** A, B

---

## r/reactnative post notes (Day 2)

Title idea: "How I handle WCAG contrast for AI-generated palettes in a white-label RN app"

Lead with the technical pattern, not the project. First paragraph: here's the
problem (LLM colors fail contrast checks at an unpredictable rate). Second
paragraph: here's the solution (draft → deterministic gate → promote). Third:
here's the code structure (3–4 lines showing the step chain). Last: repo link
as context, not as the point.

Avoid: "I built a thing" framing. This community flags self-promotion. The
framing should be "here's a pattern worth knowing."

**Reaches:** B

---

## What this launch is not trying to do

- Viral reach. The audiences are small and specific; quality of engagement
  matters more than volume.
- Product sign-ups. There is no product. The goal is repo stars, quality
  feedback, and portfolio signal.
- Comprehensive coverage. Eight days of posting is already more than most
  projects get. Day 8 is explicitly conditional on traction.
