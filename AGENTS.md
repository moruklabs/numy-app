# AGENTS.md — Numy

> **Shared conventions** (FSD, TDD, CI/CD, toolchain, screens, workflows):
> Read `/Users/fatih/mobile/AGENTS.md` first.

---

## App Identity

| Field                   | Value                 |
| ----------------------- | --------------------- |
| **App Name**            | `numy`                |
| **Bundle / Package ID** | `_(see settings.ts)_` |
| **GitHub Repository**   | `moruklabs/numy`      |

---

## MCP Config (App-Specific)

### Sentry

| Field             | Value                      |
| ----------------- | -------------------------- |
| **Organization**  | `moruk`                    |
| **Project Slug**  | `numy`                     |
| **Project ID**    | `_(see Sentry dashboard)_` |
| **Region / Host** | `de.sentry.io`             |
| **Dashboard**     | `https://moruk.sentry.io`  |

### Firebase

| Field                 | Value                      |
| --------------------- | -------------------------- |
| **Project ID**        | `_(see Firebase console)_` |
| **Project Number**    | `_(see Firebase console)_` |
| **Package (Android)** | `_(see settings.ts)_`      |
| **Bundle (iOS)**      | `_(see settings.ts)_`      |
| **Android App ID**    | `_(see Firebase console)_` |
| **iOS App ID**        | `_(see Firebase console)_` |
| **Dashboard**         | `_(see Firebase console)_` |

### SonarQube

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Organization** | `moruklabs`                                                    |
| **Project Key**  | `moruklabs_numy-app`                                           |
| **Dashboard**    | `https://sonarcloud.io/project/overview?id=moruklabs_numy-app` |

### GitHub

| Field          | Value                     |
| -------------- | ------------------------- |
| **Repository** | `moruklabs/numy`          |
| **Toolsets**   | `issues`, `pull_requests` |
