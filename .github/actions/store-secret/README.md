# Store File as GitHub Secret Action

This composite action stores the content of a file as a GitHub Actions repository secret with optional encryption support.

## Features

- Stores any file content as a GitHub Actions secret
- Optional libsodium encryption for enhanced security
- Reusable for any file-to-secret scenario
- Handles both encrypted and non-encrypted storage

## Usage

### With Encryption (Recommended for Production)

```yaml
- name: Store sensitive file as secret
  uses: ./.github/actions/store-secret
  with:
    file-path: 'sensitive-file.xml'
    secret-name: 'MY_SENSITIVE_SECRET'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    use-encryption: 'true'
```

### Without Encryption

```yaml
- name: Store file as secret
  uses: ./.github/actions/store-secret
  with:
    file-path: 'config-file.json'
    secret-name: 'MY_CONFIG_SECRET'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    use-encryption: 'false'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `file-path` | Path to the file to store as secret | Yes | |
| `secret-name` | Name of the GitHub Actions secret | Yes | |
| `github-token` | GitHub token with repository permissions | Yes | |
| `use-encryption` | Whether to use libsodium encryption | No | `false` |

## Prerequisites

- The specified file must exist in the workspace
- The GitHub token must have `secrets` write permissions

## Security Notes

- Set `use-encryption: 'true'` for production secrets containing sensitive data
- The `github-token` should have minimal required permissions
- Files containing sensitive information should be handled securely

## Example: Storing Azure Publish Profiles

```yaml
- name: Download publish profile
  run: |
    az webapp deployment list-publishing-profiles \
      --name "my-webapp" \
      --resource-group "my-rg" \
      --xml > publish-profile.xml

- name: Store publish profile as secret
  uses: ./.github/actions/store-secret
  with:
    file-path: 'publish-profile.xml'
    secret-name: 'AZURE_WEBAPP_PUBLISH_PROFILE'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    use-encryption: 'true'
```