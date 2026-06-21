# 📝 Release Notes Structure Specification

When generating the `RELEASE_NOTES.md` file, follow this exact structure and formatting.

---

## **Header**

Each release notes file should begin with a version header in the following format:

```markdown
## Version {{version}} - {{current_date}}
```

- `{{version}}` → extracted from the branch name `release/{{version}}`
- `{{current_date}}` → current date formatted as `DD MMM YYYY` (e.g., `08 Nov 2025`)

---

## **Content Sections**

All commits and PR titles since the last release should be categorized into the following sections, based on their message content:

### 🟩 **Features**

Include all messages containing any of the keywords:

- `feat`
- `feature`
- `add`

### 🐛 **Bugs**

Include all messages containing any of the keywords:

- `fix`
- `bug`
- `error`

### ⚙️ **Enhancements**

Include all messages containing any of the keywords:

- `enhance`
- `improve`
- `refactor`

### 🗂️ **Others**

Include all remaining commit messages or PR titles that don’t match the above categories.

---

## **Markdown Layout Example**

```markdown
## Version 1.2.0 - 08 Nov 2025

### 🟩 Features

- Added new login endpoint for OAuth2
- feat: Support for multi-tenant user roles

### 🐛 Bugs

- fix: Resolve null pointer issue in auth middleware
- Fixed crash when API response is empty

### ⚙️ Enhancements

- refactor: Improved caching layer for user sessions
- enhance: Reduced response latency for dashboard API

### 🗂️ Others

- Updated documentation for API rate limits
- chore: bump dependencies
```

---

## **File Handling Rules**

- Always **overwrite** any existing `RELEASE_NOTES.md` file — do **not append**.
- Maintain consistent Markdown heading hierarchy:
  - `##` for the version header
  - `###` for section titles
- Preserve emoji icons and section order exactly as shown.
- Ensure there’s a blank line between each section for readability.
- Avoid including commit hashes or author names — only summarize meaningful messages.

---

## **Formatting Notes**

- Use hyphens (`-`) for list items.
- Keep lines concise (under 100 characters).
- Maintain proper indentation and blank lines between sections.
- Ensure the final file is valid Markdown with no trailing whitespace.
