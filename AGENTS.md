<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep daily-form classroom matching in a browser-safe helper shared with tests, so assignments reliably map to template cells despite classroom punctuation differences.
- Keep multi-teacher substitution planning in a dedicated component with browser-safe planning helpers; stage editable choices locally and persist each teacher's changes in one batch before advancing to avoid duplicate active assignments.
- Derive daily-form assignments and uncovered teaching slots from explicit workflow absence plans in the shared browser-safe form helper, so the footer and classroom cells reflect the same selected scope.
- Model dedicated substitutes with a persisted teacher flag and shared candidate helpers, not synthetic schedule slots or name matching, so schedule-free availability respects the same date/hour conflict and absence checks.
