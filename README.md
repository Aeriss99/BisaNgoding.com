<div align="center">

<img src="public/pwa-512x512.png" alt="BisaNgoding logo" width="110" />

# BisaNgoding

**Free, interactive coding lessons in Bahasa Indonesia**

**English** &nbsp;|&nbsp; [Bahasa Indonesia](README.id.md)

[![Open site](https://img.shields.io/badge/Open-Site-FFD43B?style=flat&logo=googlechrome&logoColor=black)](https://aeriss99.github.io/BisaNgoding.com/)
[![Version](https://img.shields.io/github/v/tag/Aeriss99/BisaNgoding.com?label=version&color=7950f2)](https://github.com/Aeriss99/BisaNgoding.com/tags)
![Courses](https://img.shields.io/badge/courses-17-2f9e44)
![Lessons](https://img.shields.io/badge/lessons-1%2C250%2B-2f9e44)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8?logo=pwa&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-555555)](LICENSE)

[Features](#features) • [Courses](#courses) • [Running locally](#running-locally) • [Adding lessons](#adding-lessons) • [Deployment](#deployment) • [License](#license)

</div>

---

**BisaNgoding** is a SoloLearn-style learning site for Indonesian learners. Lessons are short, every lesson ends with practice, and Java, JavaScript, Python, and PHP code runs right in the browser with nothing to install. It is free, written in Bahasa Indonesia, and installable on phones.

## Features

<table>
<tr>
<td width="50%" valign="top">

### Code runs in the browser
Java runs on [CheerpJ](https://cheerpj.com/), JavaScript in a Web Worker, TypeScript is checked by the real compiler, Node.js by an emulated runtime, Python by Pyodide, and PHP 8.3 by WebAssembly. No server needed.

</td>
<td width="50%" valign="top">

### Practice with Lingga
Many lessons (Java, JavaScript, Python Basics, PHP Basics) include guided practice in the editor: Lingga shows an example, then you continue the code step by step while building a Todolist app.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Step-by-step exercises
Each lesson has theory, runnable examples, comprehension checks, fill-in questions, and a coding challenge. Every module ends with a quiz whose answer options are shuffled.

</td>
<td width="50%" valign="top">

### Saved progress
Sign in with Google and your XP, streak, and finished lessons sync through Supabase. Offline, progress is still kept on the device.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Mobile first
Designed for phone screens and installable as an app (PWA), with automatic updates.

</td>
<td width="50%" valign="top">

### Lessons as JSON
All lessons are JSON files checked by automated tests, including re-running every code example and answer key.

</td>
</tr>
</table>

## Courses

Course content is in Bahasa Indonesia.

| Course | Contents |
| --- | --- |
| **Java** | Java Basics, Todolist Project, OOP, Collections, Records & Sealed Classes, Standard Classes, Generics, Lambda, Stream, Date & Time, Input Output, OOP Todolist Project, Maven, Unit Testing, Logging, Lombok, JDBC, Database Todolist Project, Validation, JSON, CSV, Internationalization, Threads, Reflection & Annotations, Web Servlet, JPA & Hibernate, Resilience4j, Java 21 |
| **JavaScript** | JavaScript Basics, Todolist Project, OOP, DOM, Standard Library, Async, and Modules |
| **Python** | Python Basics (20 lessons with Todolist practice), Conditions, Loops, Collections, Functions, Text and Files, Errors and OOP, and a final Todolist project; code runs on real Python (Pyodide) in the browser |
| **PHP** | PHP Basics: echo, variables and types, strings, operators, if/elseif/match, loops, arrays, functions, up to a Todolist app project; code runs on real PHP 8.3 (WebAssembly) in the browser |
| **TypeScript** | Basic types, objects and interfaces, functions, unions and narrowing, generics, classes, utility types, async and modules, tooling (tsc, tsconfig, npm) and a Todolist project; code is checked by the real TypeScript compiler (strict) in the browser |
| **Node.js** | Node.js basics, ESM and CommonJS, npm, file system, async and the event loop, streams, HTTP server, Express 5, middleware and Zod validation, layered REST API, authentication (bcrypt, JWT), PostgreSQL with Prisma, testing (node:test, Supertest), production and deployment, REST API Todolist project; Node.js code runs in the browser |
| **Git & GitHub** | From Git on your laptop to GitHub: tags and releases, pull requests, code review, project management, security, CI/CD, fixing history (amend, revert, reset, rebase), and team workflows |
| **Tailwind CSS** | Tailwind v4: colors, spacing, flexbox, grid, mobile-first responsive design, states, group/peer, dark mode, arbitrary values, theming with @theme, @apply, and a Todolist UI project (live preview in the browser) |
| **React** | React 19: components and JSX, props, conditional rendering, lists and keys, state and events, controlled forms, useRef, useEffect, Context, useReducer, custom hooks, React Router 7, and a Todolist project through build and publish (React code runs in the browser) |
| **Linux & Terminal** | Linux basics, terminal and navigation, files and folders, reading and searching text, permissions, installing software, processes and services, networking and SSH, bash scripting, cron, server hardening, Nginx |
| **Microsoft Excel** | Worksheets and formulas (Indonesian locale), SUM to absolute references, Rupiah and date formats, IF, COUNTIF/SUMIF, text and date functions, VLOOKUP, INDEX+MATCH, XLOOKUP, sort, filter, PivotTable, charts, case studies and job-test simulations, practiced on a mock Excel sheet |
| **RESTful API** | HTTP, REST principles, curl and fetch, API design, OpenAPI, security (OWASP API Top 10), online store API project |
| **Spring Boot** | Spring Basics: IoC, beans, dependency injection, component scan, bean scopes and lifecycle (theory + practice on your own computer) |
| **DevOps** | DevOps basics, Docker, Docker Compose, advanced CI/CD, deploying to a server, Kubernetes, cloud basics, monitoring and logs, and Terraform (theory + practice on your own computer) |
| **English for IT** | Everyday English up to workplace English for IT, with listening and sentence-building exercises |

## Tech stack

| Part | Used |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4, React Router (HashRouter), CodeMirror |
| Build | Vite, PWA (vite-plugin-pwa) |
| Data and auth | Supabase (Google sign-in, progress sync, Edge Functions) |
| Running code | CheerpJ (Java 8), Web Workers (JavaScript, emulated Node.js), TypeScript compiler, Pyodide (Python), @php-wasm (PHP 8.3) |
| Testing | Vitest, Playwright |

## Running locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For sign-in and progress sync, create `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=anon-key-from-supabase
```

Use the **anon key** only. Never put a `service_role` key in this project. `.env.local` is not committed.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` | check content and types, then build to `dist/` |
| `npm run test:unit` | unit tests (Vitest) |
| `npm run test:content` | validate every lesson file |
| `npm run test:java` | compile and run every Java example (needs a JDK) |
| `npm run test:e2e` | end-to-end tests (Playwright) |

### Folder structure

```
content/              lessons, one folder per course
  courses.json        course list
  jalur-karier.json   career paths on the home page
  roadmap.json        learning plans per role
  <course>/           java, javascript, typescript, nodejs, git, mysql, linux, html-css, tailwind, rest-api, english, excel, python, php
    modules.json      modules of that course
    <module>/         lesson-XX.json + quiz.json
public/               images, illustrations, English audio, PWA icons, and tools.jar for CheerpJ
src/
  components/         UI components (lesson cards, layout, English exercises)
  context/            auth and progress
  data/               static data (English voice recordings list)
  lib/                logic: content, quiz, Java/JS/Python/PHP runners, streak, audio
  pages/              pages
  types/              content data types (schema.ts)
  test/               unit tests (some small tests sit next to the file they test)
scripts/              content checks, lesson validation, Java tests, new-module announcements
supabase/             Edge Functions and database migrations (email notifications)
e2e/                  Playwright tests
.github/workflows/    cek.yml (test + build) and rilis.yml (deploy from a version tag)
```

## Adding lessons

Lessons are plain JSON files, no code changes needed:

1. Create a module folder in `content/<course>/` with `lesson-01.json`, `lesson-02.json`, and so on, plus `quiz.json`.
2. Register the module in `content/<course>/modules.json` (`id`, `title`, `order`, `lessonCount`, `status: "ready"`, `requires`).
3. Run `npm run build && npm run test:content`. For the Java course, also run `npm run test:java`.

Card types and their fields are in `src/types/schema.ts`. Java code that runs in the browser must be **Java 8** compatible, because the editor uses CheerpJ 3 (Java 8). Lessons that need newer features use `"javaVersion": 17` or `21` with `"runnable": false`: theory and questions only, practiced on the learner's own computer.

Java libraries for the editor (JUnit 5, Mockito, Logback, Lombok, H2, Hibernate Validator, Jackson, Commons CSV, Hibernate ORM, Jakarta Servlet, Resilience4j) live in `public/java-lib` and are added automatically based on the code's `import` statements, using the rules in `src/lib/javaPustaka.json`. The source of `bisangoding.jar` (JUnit runner, log format, and `ServerUji` for Servlets) is in `pustaka-java/`, built with `pustaka-java/bangun.sh`.

## Deployment

The site only updates when a **version tag** is pushed (for example `v0.0.1`), through `.github/workflows/rilis.yml`: check the tag is on `main`, test, build, deploy to GitHub Pages, then announce new modules. The version number appears in the app and in `version.json`.

Pushes to `main`, `kecil/*`, or `feat/*` only run tests and the build (`.github/workflows/cek.yml`) without changing the site.

Versioning: the last number for fixes (`v0.0.1` → `v0.0.2`), the middle number for new lessons, courses, or features (`v0.0.2` → `v0.1.0`). To roll back: Actions > **Rilis ke GitHub Pages** > **Run workflow** > pick an older tag.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` come from GitHub Secrets.

## License

Released under the [MIT License](LICENSE). Free to use, modify, and share, as long as the copyright notice and license are included.

Made by [Lingga Ardyansyah](https://github.com/Aeriss99).
