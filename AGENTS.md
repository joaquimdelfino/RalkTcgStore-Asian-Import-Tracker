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

- Keep order validation, initial data, and summary calculations in a browser-safe module so rules can be tested independently.
- Load and persist orders only after hydration; preserve an empty saved list and block writes when saved data cannot be read to prevent data loss.
- Store private order books in Lovable Cloud using authenticated server functions, owner-scoped RLS, and serialized version-checked writes to avoid cross-account leaks and stale-device overwrites.
- Treat browser storage only as a one-time legacy import after account hydration; initialize atomically from the migration's template and never replace an existing online book, even when empty.
- Use shared Shadcn controls for order statuses, calendar selection, and deletion confirmation to keep interactions consistent and accessible.
- Keep presentation separate from stored identifiers and business rules; rebranding must preserve existing order books and legacy import keys.
- Render summary metrics as an unframed band and define all visual roles in global semantic tokens so appearance changes remain consistent across account and order screens.
