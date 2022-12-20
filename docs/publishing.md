The release process here mostly follows along with the [vbump script](https://github.com/indexzero/vbump) that @indexzero wrote several years ago, but the main steps for a release are as follows:

1. Complete merging in any PRs that should be part of the release.
1. On the [Releases tab](https://github.com/winstonjs/winston/releases) in the GitHub UI, click 'Draft a new release' in the upper right corner.
1. Under the 'Choose a tag' dropdown, type the name of the new version starting with a v (e.g. `v3.7.0`) and don't forget to click the 'Create new tag on publish' option below (this step is annoyingly easy to miss):
![image](https://user-images.githubusercontent.com/563406/160644343-69325988-4ca2-4329-93da-e08266269506.png)
1. Paste the same version number, with or without the v (with is probably better) in the release title box.
1. Click 'Generate release notes' and cut & paste the draft contents into the changelog.
1. Paste the contents of the changelog for this release in the 'Describe this release' box.
1. Check to make sure you've caught everything using GitHub's compare tool ([example here](https://github.com/winstonjs/winston/compare/v3.6.0...master)).
1. Update the changelog. It's nice to thank the contributors here.  It's nice to organize this by which changes would merit which level of semver bump, and especially call out any breaking changes (major-version-number) concisely at the start.
1. **Update the version number in package.json and package-lock.json**, bumping as appropriate for [semver](https://semver.org/) based on the most significant position change trigger from the changelog you just wrote/reviewed.  Do not miss this step! Also note there are two places in package-lock where this ges updated: at the top level and under the empty-string entry of packages.
1. Update the tag and version number on the Draft a New Release page, with the same number (which might've changed while drafting changelog notes).
1. Make sure your local master branch is up to date.
1. Make sure all the lint checks and tests pass, beyond what the CI might've told you.
1. Paste the contents of the changelog for this release in the 'Describe this release' box on the Draft a Release page.
1. Click "Publish release."
1. Back on the command line, `npm publish` and complete npm 2FA as needed.
1. Update the distribution tags, for example: `npm dist-tag add winston@3.7.0 3.x-latest`.
1. Verify the distribution tags look correct under the 'Versions' tab at https://www.npmjs.com/package/winston or with `npm dist-tag ls`.
1. Keep a closer-than-usual eye on issues in the hours and days that follow, prepared to quickly revert/address anything that might be associated with that release.

A more professional version of this would probably use a release branch off master to make sure no other maintainers merge a PR into master between the loading of a compare view for changelog preparation and completion of the process, but we're such a small team that the extra steps are probably not needed. After release, you can also verify with the compare view between the new and prior release tags to see when the latest change was and verify it was before you started the process.
