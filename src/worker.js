const GithubClient = require('./github');

const LABELS = [
  {
    name: 'release',
    description: 'release pr',
    color: 'fef2c0',
  },
];

function getDateTime() {
  const date = new Date();
  return `${date.getFullYear()}/${
    date.getMonth() + 1
  }/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
}

function getPullRequestInfo(base, head, compareData) {
  const title = `release - ${getDateTime()}`;
  const { commits } = compareData;

  const commitMessageList = ['**commits list:**\n'];
  if (commits && commits.length > 0) {
    commits.reduce((acc, cur) => {
      const { committer } = cur;
      const message = cur.commit.message;
      const author = committer ? committer.login : cur.commit.committer.name;
      if (!message.startsWith('Merge pull request') && !message.startsWith('Merge branch')) {
        acc.push(`- @${author} ${message}`);
      }
      return acc;
    }, commitMessageList);
  }
  return {
    title,
    body: commitMessageList.join('\n'),
    base,
    head,
  };
}

async function run(token, org, repos, assignees, head, base) {
  if (!repos || repos.length === 0) {
    console.log('no repos , skip');
    return;
  }

  const githubClient = new GithubClient(token, org);
  return Promise.all(
    repos.map(async (repo) => {
      const result = {
        status: 'success',
        repo,
      };
      try {
        const compareResp = await githubClient.compareBranches(repo, base, head);
        const compareData = compareResp.body;
        if (compareData.files.length === 0) {
          result.message = 'no changes.';
          return result;
        }
        const labels = await githubClient.getOrCreateLabels(repo, LABELS);
        const prUrl = await githubClient.createPullRequest(
          repo,
          getPullRequestInfo(base, head, compareData),
          labels,
          assignees
        );
        result.pr_url = prUrl;
      } catch (err) {
        result.status = 'failed';
        if (err.status) {
          result.http_status = err.status;
          console.error(`🔴 Failed repo: ${result.repo}`, err.response.text);
          const respBody = err.response.body;
          result.message = respBody.message;
          if (respBody.errors) {
            result.error_message = Array.isArray(respBody.errors)
              ? respBody.errors[0].message
              : JSON.stringify(respBody.errors);
          }
        } else {
          result.err = err.message;
        }
      }
      return result;
    })
  );
}

module.exports.run = run;
