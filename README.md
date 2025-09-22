# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fa54b19d-935f-4ccd-a25c-f152751d8c29

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fa54b19d-935f-4ccd-a25c-f152751d8c29) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Lesson builder workflow

The new lesson builder lives at `/builder` and introduces a productivity-oriented flow for assembling tech-rich lessons:

- Search activities with stage/subject/skill chips, then flip between **Recents**, **Favorites**, and **Collections** tabs. Favorites and collections are stored in Supabase so they follow you between sessions.
- Press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> to open the command palette for quick actions like adding or duplicating steps or jumping into the activity search.
- Each step now includes an **Offline fallback** field—perfect for teacher exports when Wi-Fi drops. It is automatically hidden from the student handout export.
- Autosave keeps drafts synced to Supabase after an 800 ms pause, and a background link checker flags any broken resource URLs inline on each step.

The export menu provides teacher and student-ready text downloads that respect link health warnings and offline contingency plans.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fa54b19d-935f-4ccd-a25c-f152751d8c29) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
