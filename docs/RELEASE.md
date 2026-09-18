# Release gates

The owner approved publishing this repository under MIT with its existing history retained. That history includes installation names, paths and integration scaffolding. This approval does not include credentials or personal runtime records. No visibility change is performed by preparation scripts.

1. Confirm the target repository and owner-selected license. Configure a private vulnerability-reporting channel.
2. Review the explicit portable source inventory. Private integrations, owner-specific operations, personal records, and generated state must remain excluded.
3. Run typechecking, all candidate tests, the production build, version checks, and desktop/mobile browser checks from the isolated candidate.
4. Scan the complete source candidate and production build with a redacting secret scanner. Review private-content and dependency findings. Do not use a clean pattern scan as a guarantee.
5. Obtain authenticated access to the actual repository. Inspect tracked and untracked source, all refs, full Git history, tags, release assets, workflow artifacts, and public-facing repository metadata. Record inaccessible surfaces as unverified.
6. Resolve every finding. Exposed credentials need owner-controlled revocation or rotation; history rewriting requires separate authority and a reviewed plan. Excluding a file today does not clean its history.
7. Record the exact source and artifact digests and complete independent review of that candidate. Any subsequent content change invalidates the review.
8. Present the reviewed candidate, residual risks, license, and publication target to the owner. Wait for final confirmation before making the repository public.

The local export is a review artifact. It does not replace auditing or cleaning the existing repository and its history. It does not prove that a remote repository is private or public, synchronized, or safe to expose.

The prepared CI workflow runs portable checks on macOS and Linux and scans the checkout and fetched Git refs with Gitleaks. Its installation pins version 8.30.1 and the module path declared in [upstream go.mod](https://github.com/gitleaks/gitleaks/blob/v8.30.1/go.mod). No paid scanner integration or separately supplied API key is required. A prepared workflow is not evidence of a successful remote CI run.
