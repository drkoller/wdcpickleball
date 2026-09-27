## Shared website and preview safety

These rules apply to website edits, previews, and publication. Read-only
reviews may proceed without changing the checkout. Documentation-only tasks
require an appropriate diff review, not a website preview.

1. VERIFY AND SYNCHRONIZE BEFORE EDITING

Before editing website files, verify and report:

- Absolute repository/worktree path and other worktrees.
- Remote fetch and push destinations.
- Current branch and configured upstream.
- Staged, unstaged, and untracked files.
- Any merge, rebase, or other unfinished Git operation.

The expected shared repository is drkoller/wdcpickleball, and the shared
website baseline is origin/main. Verify these rather than assuming them.
Do not silently switch branches or use another checkout.

Fetch origin successfully and record:

- Fetch time and outcome.
- HEAD SHA.
- origin/main SHA.
- Ahead/behind counts, with each count clearly labeled.

`git fetch` alone is NOT synchronization.

If fetching fails, stop synchronization and any edit, approval, commit, or
push that depends on a verified current baseline. Report the failure;
read-only investigation may continue.

On main, if the branch is simply behind origin/main with no divergent local
commits, preserve existing local work and fast-forward only. Verify the
operation succeeded before continuing.

Before new website edits on main, when there are no intentional local
commits, require HEAD == origin/main and ahead/behind == 0/0.

If intentional local commits or an explicitly authorized feature branch are
in use, identify those commits and verify the latest origin/main is included
in the history and its content is preserved. Do not remove legitimate local
commits merely to obtain 0/0.

If histories diverge, a conflict occurs, or intent is ambiguous, preserve the
work and stop the dependent operation. Report the situation and proposed
resolution. Do not automatically rebase or create a merge commit.

Do not begin new website edits from a stale or unverified baseline.

2. PRESERVE EXISTING LOCAL WORK

Preserve and account for all existing staged, unstaged, and untracked work.
Distinguish it from the current task.

Never discard local work merely to synchronize or obtain a clean status.

Do not use:

- git reset --hard
- git clean
- force push
- Arbitrary whole-file “ours” or “theirs” conflict resolution

Before temporarily moving local work, record the original HEAD and preserve
the affected files and changes, including binary and untracked files as
applicable. Preserve staged versus unstaged state where relevant.

If using a stash, give it a descriptive name, record its exact identity, and
restore with stash apply rather than pop. Verify restoration and retain the
stash until the user authorizes removal.

Use a separate verified backup outside the repository when the amount or
importance of local work warrants one. Keep private files private and do not
add backups or credentials to Git. Preserve existing backups and stashes.

Do not overwrite newer collaborator content with an older saved copy.
Stop on conflicts or ambiguous overlapping edits.

3. RECHECK THE SHARED BRANCH BEFORE PREVIEW

Before presenting a website preview for approval, fetch origin again
successfully and compare its SHA with the baseline used for editing.

If origin/main changed:

- Preserve current local work.
- Incorporate the shared changes only through an unambiguous safe path
  permitted by sections 1 and 2; otherwise stop and report.
- Verify collaborator content and the requested local changes together.
- Rerun relevant checks.
- Present a new combined preview for approval.

Do not present an outdated preview as current.

Record the baseline SHA and exact reviewed changes associated with approval.
Approval of an earlier preview does not approve a later version whose shared
baseline or reviewed content has changed.

4. VERIFY THE ENTIRE COMBINED DIFF

Before requesting approval, compare the entire resulting working tree with
the latest fetched origin/main, not just with local HEAD.

Inspect:

- The combined tracked-file diff against origin/main.
- Staged and unstaged changes separately.
- Untracked files separately.
- Any intentional local commits that contribute to the result.

Every difference must be part of the requested task or explicitly identified
pre-existing work being preserved.

Check for unintended deletions, reversions, or overwrites of collaborator
content, including files outside the requested pages.

Run relevant existing validation checks and git diff --check. Explain any
remaining failures or verification limits.

“0 commits behind” alone does not prove that file contents are correct.

5. VERIFY THE ACTUAL PREVIEW SOURCE

Confirm that the preview serves the same repository/worktree and content
being reviewed.

Report:

- Absolute source directory.
- Actual server root or build-output directory.
- Server command and port.
- Exact preview URLs.

The current website is served directly from the repository root as static
files. A local preview can use:

python3 -m http.server 8765 --bind 127.0.0.1

Verify an existing server's source and command before reusing it. Manage only
this project's preview process. Do not assume website-preview/ or website/
contains the current site.

Check actual served HTML and relevant JavaScript, JSON, CSS, data, and other
dependencies against the reviewed source. Shared event content can be
rendered from events.json through script.js rather than embedded in HTML.

If the project later requires a build, follow its current build instructions
and rebuild from the verified combined source.

Use browser inspection when available, including desktop and mobile checks
appropriate to the change. State clearly when browser verification is
unavailable. Do not assume caching explains a mismatch without checking what
the server serves.

6. REPORT BEFORE REQUESTING APPROVAL

For a website preview, report:

- Repository/worktree, branch, and upstream.
- Synchronized baseline SHA and latest fetched origin/main SHA.
- Fetch outcome and ahead/behind counts.
- All files differing from origin/main.
- Separately identified pre-existing and untracked work.
- Requested changes verified.
- Relevant collaborator content verified as preserved.
- Preview source, server command, port, and URLs.
- Checks completed and anything not fully verified.
- Relevant diff and diff statistics.

For documentation-only work, provide the relevant content or diff and
repository-state checks without requiring a website preview.

7. COMMIT/PUSH SAFETY

Do not commit, push, or deploy without explicit authorization.
Scope authorization to the reviewed files and changes; do not include
unrelated preserved work.

Before committing:

- Fetch origin successfully.
- Confirm origin/main matches the baseline associated with approval.
- Confirm the exact changes still match the approved review.
- Stop if the baseline or reviewed content changed unexpectedly.
- Stage only reviewed files/hunks.
- Inspect the complete staged diff and verify no unrelated changes are staged.

Immediately before pushing, fetch origin successfully again.

If origin/main changed after approval or after the local commit:

- Do not push.
- Preserve the local commit and remaining work.
- Report the new remote SHA.
- Do not force push or automatically rebase.
- Reconcile only through an explicitly authorized safe path.
- Rerun relevant verification and obtain approval of the updated result,
  including a new website preview when website content is affected.

Push normally to the verified, authorized remote branch. Never force-push
main. If the push is rejected, stop and investigate; do not bypass rejection.

After a successful push:

- Fetch origin successfully.
- Verify the pushed branch and its upstream have matching SHAs and 0/0
  ahead/behind; for main, compare against origin/main.
- Report the pushed commit SHA and final git status.
- If new remote work arrived, report it rather than claiming synchronization.
- Report any preserved staged, unstaged, or untracked work honestly.
- Do not discard or include unrelated work merely to make status clean.

Do not claim the working tree is clean while untracked or modified files
remain. An intentional, reported preserved file does not invalidate a
successful push of the approved changes.

Do not perform a separate deployment without authorization. Report any known
automatic deployment triggered by the authorized push without claiming it
succeeded unless verified.
