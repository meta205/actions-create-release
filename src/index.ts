import fs from 'fs-extra';
import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

(async (): Promise<void> => {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    let owner: string = core.getInput('owner');
    let repo: string = core.getInput('repo');
    let releaseName: string = core.getInput('release-name');
    let tagName: string = core.getInput('tag-name');

    let body: string = core.getInput('body');
    let bodyPath: string = core.getInput('body-path');

    const draft: boolean = core.getInput('draft') === 'true';
    const prerelease: boolean = core.getInput('prerelease') === 'true';

    if (!owner || !repo) {
      const repoInfo: string[] = process.env.GITHUB_REPOSITORY!.split('/');
      owner = repoInfo[0];
      repo = repoInfo[1];
    }

    let bodyFileContent: any = null;
    if (bodyPath !== '' && !!bodyPath) {
      bodyFileContent = fs.readFileSync(bodyPath, { encoding: 'utf8' });
    }

    const {
      data: {
        id: releaseId,
        html_url: htmlUrl,
        upload_url: uploadUrl,
        draft: draftStatus
      }
    } = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name: releaseName,
      body: bodyFileContent || body,
      draft,
      prerelease
    });

    if (!draftStatus) {
      await octokit.repos.updateRelease({
        owner,
        repo,
        release_id: releaseId,
        draft: true
      });
    }

    core.setOutput('id', releaseId);
    core.setOutput('html_url', htmlUrl);
    core.setOutput('upload_url', uploadUrl);
  } catch (err: any) {
    core.setFailed(err.message);
  }
})();
