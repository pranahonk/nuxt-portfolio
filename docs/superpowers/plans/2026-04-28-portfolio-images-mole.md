# Portfolio: Add Images + Update Alkitab/Dicty + Add Mole Project

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cover/images to the Alkitab (id: 11) and Dicty (id: 12) portfolio entries using their App Store artwork, update their tech stacks and descriptions to match the published apps, and add a new Mole (id: 24) open-source contribution entry.

**Architecture:** All project data lives in `server/data/portfolioData.ts`. Images are referenced as either `getOptimizedImagePath('local.png')` for files in `public/images/portfolio/` or as raw URL strings for remote CDN images. Both apps have published App Store pages whose artwork is served by Apple's CDN (`is1-ssl.mzstatic.com`) — stable, permanent URLs for published apps.

**Tech Stack:** TypeScript, Nuxt 3

---

## Files to Change

| File | Action | Reason |
|------|--------|--------|
| `server/data/portfolioData.ts` | Modify | Add coverImage/images, update tech stacks, add Mole entry |

---

### Task 1: Update Alkitab / Bilby Bible App entry (id: 11)

**Files:**
- Modify: `server/data/portfolioData.ts` (lines 486–526)

- [ ] **Step 1: Replace the entire id: '11' project object**

Find the existing entry starting with `id: '11'` (around line 487) and replace it with:

```ts
    {
      id: '11',
      title: 'Bilby — Faith Bible App',
      description:
        'A cross-platform offline Bible app built with Flutter and published on the App Store and Google Play, featuring daily verses, saved verses, and church content.',
      fullDescription:
        'Bilby (Roh Allah Yang Hidup) is a cross-platform Flutter application published on both the App Store and Google Play. It provides a full Bible reading and study experience with an offline-first architecture: all Bible content is cached locally via Hive so it works without an internet connection. The app features daily verse reminders via Flutter Local Notifications, a saved-verses system, church content sections, and a clean responsive UI with shimmer loading, staggered animations, and pull-to-refresh. State management uses Riverpod with code generation (riverpod_generator), data models are type-safe via Freezed + json_serializable, and network requests go through Dio.',
      techStack: ['Flutter', 'Dart', 'Riverpod', 'Hive', 'Freezed', 'Dio', 'Flutter Local Notifications'],
      liveUrl: 'https://apps.apple.com/id/app/bilby-roh-allah-yang-hidup/id6749470906',
      codeUrl: 'https://github.com/pranahonk/New-bible-App',
      openSource: true,
      public: true,
      tags: ['mobile', 'flutter', 'dart', 'offline', 'ios', 'android'],
      coverImage:
        'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3f/05/98/3f05980e-69ed-195b-7f7f-9f3c37230baf/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/512x512bb.jpg',
      images: [
        'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3f/05/98/3f05980e-69ed-195b-7f7f-9f3c37230baf/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/512x512bb.jpg',
      ],
      gradient: getRandomGradient(),
      features: [
        'Published to App Store and Google Play',
        'Offline-first: full Bible cached locally with Hive',
        'Daily verse push notifications',
        'Saved verses system with local persistence',
        'Church and devotional content sections',
        'Shimmer loading and staggered animations',
        'Pull-to-refresh and i18n/localisation',
        'Clean architecture: api/, blocs/, models/, providers/, screens/, widgets/',
      ],
      challenges: [
        'Offline-first data sync with Hive local storage',
        'Riverpod code generation setup with riverpod_generator',
        'Type-safe models across Freezed + json_serializable',
        'Cross-platform push notifications with Flutter Local Notifications',
      ],
      learnings: [
        'Flutter cross-platform iOS and Android development',
        'Riverpod state management with code generation',
        'Hive offline-first architecture',
        'Publishing to both App Store and Google Play',
      ],
      role: 'Mobile Developer',
      company: 'Open Source',
      duration: 'Personal Project',
    },
```

- [ ] **Step 2: Verify the change**

Run:
```bash
grep -A3 "id: '11'" server/data/portfolioData.ts
```
Expected output contains `Bilby — Faith Bible App` and the `is1-ssl.mzstatic.com` coverImage URL.

- [ ] **Step 3: Commit**

```bash
git add server/data/portfolioData.ts
git commit -m "feat(portfolio): update Bilby Bible App entry with App Store icon and correct tech stack"
```

---

### Task 2: Update Dicty iOS Dictionary App entry (id: 12)

**Files:**
- Modify: `server/data/portfolioData.ts` (lines 527–561)

- [ ] **Step 1: Replace the entire id: '12' project object**

Find the existing entry starting with `id: '12'` (around line 528) and replace it with:

```ts
    {
      id: '12',
      title: 'Dicty — iOS Dictionary App',
      description:
        'A native iOS dictionary app built with SwiftUI and published on the App Store, featuring real-time word lookup, audio pronunciations, bookmarks, and debounced search.',
      fullDescription:
        'Dicty Slang is a native SwiftUI iOS application published on the App Store that delivers a fast and clean dictionary experience. Built with MVVM architecture and Combine for reactive state management, it integrates the dictionaryapi.dev API for real-time definitions. The app features audio pronunciations via AVAudioPlayer, a bookmarks system persisted with UserDefaults, recent searches history, and 500 ms debounced search to minimise API calls. UI details include haptic feedback, splash screen animations, and fully responsive layouts tested on both iPhone and iPad.',
      techStack: ['Swift', 'SwiftUI', 'Combine', 'MVVM', 'AVAudioPlayer', 'UserDefaults', 'Xcode'],
      liveUrl: 'https://apps.apple.com/id/app/dicty-slang/id6749675040',
      codeUrl: 'https://github.com/pranahonk/Dicty',
      openSource: true,
      public: true,
      tags: ['mobile', 'ios', 'swift', 'swiftui'],
      coverImage:
        'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d6/35/6c/d6356c18-0756-cb14-dba8-b560e2bc0637/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg',
      images: [
        'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d6/35/6c/d6356c18-0756-cb14-dba8-b560e2bc0637/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg',
      ],
      gradient: getRandomGradient(),
      features: [
        'Published on the App Store',
        'Real-time word lookup via dictionaryapi.dev',
        'Audio pronunciation playback with AVAudioPlayer',
        'Bookmarks persisted with UserDefaults',
        'Recent searches history',
        '500 ms debounced search to reduce API calls',
        'Haptic feedback and splash screen animations',
        'Responsive iPhone and iPad layouts',
      ],
      challenges: [
        'Implementing MVVM with Combine publishers for async API calls',
        'Debouncing search input while keeping the UI responsive',
        'Managing audio session lifecycle for AVAudioPlayer',
        'Building adaptive layouts for different iPhone and iPad sizes',
      ],
      learnings: [
        'Native iOS development with SwiftUI and Combine',
        'MVVM reactive architecture patterns',
        'App Store submission and review process',
        'AVAudioPlayer and haptic feedback APIs',
      ],
      role: 'iOS Developer',
      company: 'Open Source',
      duration: 'Personal Project',
    },
```

- [ ] **Step 2: Verify the change**

Run:
```bash
grep -A3 "id: '12'" server/data/portfolioData.ts
```
Expected output contains `SwiftUI` in the techStack and the `is1-ssl.mzstatic.com` coverImage URL.

- [ ] **Step 3: Commit**

```bash
git add server/data/portfolioData.ts
git commit -m "feat(portfolio): update Dicty entry with App Store icon, SwiftUI tech stack, and richer description"
```

---

### Task 3: Add Mole open-source contribution (id: 24)

**Files:**
- Modify: `server/data/portfolioData.ts` (after line 961, inside the array before `]`)

- [ ] **Step 1: Insert new Mole entry**

Find the closing `},` of project id: '23' (around line 961) and add the following entry after it, just before the `]` that closes the projects array (line 962):

```ts
    {
      id: '24',
      title: 'Mole — Open Source Contribution',
      description:
        'Contributed merged PRs to Mole, a 49K-star macOS/Windows system cleaner CLI — adding deep Brave Browser cleanup support and a Windows version-fallback fix.',
      fullDescription:
        'Mole is a popular open-source macOS and Windows system cleaner CLI (Shell/PowerShell) with 49K+ GitHub stars, serving as a free alternative to CleanMyMac and DaisyDisk. It deep-cleans browser caches, GPU shader caches, CRX extensions, and unused app data to free significant disk space. My contributions include PR #637 (merged) adding 89 lines of deep Brave Browser cleanup — cache, GPU cache, shader cache, and CRX cleanup support — PR #636 (merged) fixing a hardcoded Windows version fallback to 1.29.1, and PR #670 (submitted) adding missing shader and Dawn cache cleanup paths for Chrome.',
      techStack: ['Shell', 'Bash', 'PowerShell', 'macOS', 'CLI'],
      liveUrl: 'https://github.com/tw93/Mole',
      codeUrl: 'https://github.com/tw93/Mole/pulls?q=is%3Apr+author%3Apranahonk',
      openSource: true,
      public: true,
      tags: ['open-source', 'cli', 'macos', 'shell', 'contribution'],
      coverImage: 'https://gw.alipayobjects.com/zos/k/ro/ZzF8e8.png',
      images: ['https://gw.alipayobjects.com/zos/k/ro/ZzF8e8.png'],
      gradient: getRandomGradient(),
      features: [
        '49K+ GitHub stars — widely used macOS/Windows system cleaner',
        'PR #637 (merged): deep Brave Browser cleanup — cache, GPU, shader, CRX',
        'PR #636 (merged): fix hardcoded Windows version fallback to 1.29.1',
        'PR #670 (submitted): missing shader and Dawn cache cleanup for Chrome',
        'Shell + PowerShell scripts for cross-platform deep cleaning',
        'Free open-source alternative to CleanMyMac and DaisyDisk',
      ],
      challenges: [
        'Understanding Brave Browser internal cache path structure across macOS versions',
        'Ensuring cleanup scripts are safe and idempotent (no data loss)',
        'Cross-platform testing macOS vs Windows path conventions',
      ],
      learnings: [
        'Contributing to large open-source projects with strict code review',
        'Shell scripting patterns for reliable file system operations',
        'macOS application data directory conventions',
      ],
      role: 'Open Source Contributor',
      company: 'Open Source (tw93/Mole)',
      duration: 'Apr 2024',
    },
```

- [ ] **Step 2: Verify the entry was inserted**

Run:
```bash
grep -A3 "id: '24'" server/data/portfolioData.ts
```
Expected: output shows `Mole — Open Source Contribution`.

Run:
```bash
grep -c "id: '" server/data/portfolioData.ts
```
Expected: `24` (24 project entries total).

- [ ] **Step 3: Commit**

```bash
git add server/data/portfolioData.ts
git commit -m "feat(portfolio): add Mole open-source contribution entry (PRs #637, #636, #670)"
```

---

### Task 4: Build check + push

- [ ] **Step 1: TypeScript check**

```bash
yarn build 2>&1 | tail -20
```
Expected: build completes without TypeScript errors. If there are errors, they will typically be in `portfolioData.ts` due to a missing comma or bracket — fix the specific line reported.

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

## Out of Scope

- Downloading App Store screenshots and uploading them locally (the app icons from `is1-ssl.mzstatic.com` are sufficient and stable)
- Adding a Google Play link to the Bilby entry (can be done later once the Play Store URL is confirmed)
- Changing the Mole `duration` (Apr 2024 is approximate — adjust if exact PR dates matter)

## Notes

- The Apple CDN URLs (`is1-ssl.mzstatic.com`) for published App Store apps are permanent and don't require authentication — safe to use as `coverImage`.
- The Alipay CDN URL for the Mole screenshot (`gw.alipayobjects.com`) was verified as accessible (HTTP 200, content-type: image/png).
- The `codeUrl` for Mole points to a filtered PR search showing only Prana's contributions to the repo.
