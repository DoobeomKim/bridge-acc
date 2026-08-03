# Deployment

The `main` branch is connected to the Vercel production project.

- Pushes with actual file changes trigger a production deployment.
- Empty commits may be ignored because the source tree is unchanged.
- Production secrets must be configured in Vercel Environment Variables and must not be committed to Git.
- Deployment failures should be reviewed in the Vercel deployment logs before retrying.

