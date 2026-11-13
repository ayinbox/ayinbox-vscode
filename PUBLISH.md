# Publishing

A `v*` tag runs `.github/workflows/release.yml`, which packages the extension once and publishes that same `.vsix` to the Visual Studio Marketplace and to Open VSX.

## One-time setup

1. **Visual Studio Marketplace publisher.** Sign in at https://marketplace.visualstudio.com/manage with the Microsoft account that will own it, choose **Create publisher**, ID `ayinbox` (it cannot be changed later), name `AY Inbox`.
2. **Marketplace token.** In Azure DevOps (https://dev.azure.com), create a Personal Access Token with Organization **All accessible organizations** and scope **Marketplace > Manage**. Check it with `npx @vscode/vsce login ayinbox`. Microsoft retires global PATs on December 1, 2026 and recommends federated identity (`vsce publish --azure-credential` after `azure/login`); switch the workflow to that when you set it up.
3. **Open VSX namespace.** Sign in at https://open-vsx.org with GitHub, sign the publisher agreement, create an access token under your profile, then `npx ovsx create-namespace ayinbox -p <token>`. To get the namespace marked verified, claim it through the issue form at https://github.com/EclipseFdn/open-vsx.org.
4. **GitHub environment.** In `ayinbox/ayinbox-vscode` > Settings > Environments, create `release` (restrict it to `v*` tags and add a required reviewer if wanted) with secrets `VSCE_PAT` and `OVSX_PAT`.

## Each release

Bump `version` in `package.json` and `CHANGELOG.md`, commit, then:

```bash
git tag v0.1.0
git push origin v0.1.0
```
