# Dheeraj Karki's Digital Garden

A personal website and growing collection of notes on software engineering,
robotics, and research. This is an initial version and a work in progress.

## Content

- [bio.md](bio.md): short, medium, and long biographies.
- [now.md](now.md): current work and interests.
- [notes/](notes/): Markdown notes, including nested folders.
- [index.html](index.html): the website layout and reader.

## Publishing

Most ongoing updates will be written in Obsidian, then committed and pushed to
`main` manually or through the Obsidian Git plugin. Obsidian Sync alone does not
push to GitHub.

GitHub Actions automatically discovers notes, generates the deployment's note
index, and publishes to GitHub Pages. Set **Settings > Pages > Source** to
**GitHub Actions** once to enable deployment.

For local preview, open [index.html](index.html) with VS Code Live Server.
Update [notes_index.json](notes_index.json) when adding or moving local notes;
the deployed index is generated automatically.

Everything committed here is public, including the CV and note files.
`publish: false` hides a note from the reader, not from the repository or hosting.
