const request = require('superagent');

const API_BASE = 'https://api.github.com';

const CONFLICTS_LABEL = {
  name: 'conflict',
  description: 'have conflicts',
  color: 'd73a4a',
};

class GithubApi {
  constructor(token, org) {
    this.token = token;
    this.org = org;
    this.headers = {
      'User-Agent': 'thimble-ops-cli-client',
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.sailor-v-preview+json',
    };
  }

  get(reqUrl) {
    return request.get(reqUrl).set(this.headers).type('application/json');
  }

  post(reqUrl, data) {
    return request.post(reqUrl).set(this.headers).type('application/json').send(data);
  }

  compareBranches(repo, base, head) {
    const reqUrl = `${API_BASE}/repos/${this.org}/${repo}/compare/${base}...${head}`;
    return this.get(reqUrl);
  }

  async createLabel(repo, label) {
    const reqUrl = `${API_BASE}/repos/${this.org}/${repo}/labels`;
    try {
      await this.post(reqUrl, label);
      return label.name;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getOrCreateLabels(repo, labels) {
    if (!labels || !(labels instanceof Array) || labels.length === 0) {
      return [];
    }
    const list = await Promise.all(
      labels.map(async (label) => {
        const reqUrl = `${API_BASE}/repos/${this.org}/${repo}/labels/${label.name}`;
        try {
          await this.get(reqUrl);
          return label.name;
        } catch (err) {
          if (err.status === 404) {
            return this.createLabel(repo, label);
          }
          console.log(err);
          return null;
        }
      })
    );

    if (list) {
      return list.reduce((acc, item) => {
        if (item) {
          acc.push(item);
        }
        return acc;
      }, []);
    }
    return [];
  }

  async createPullRequest(repo, data, labels, assignees) {
    const reqUrl = `${API_BASE}/repos/${this.org}/${repo}/pulls`;
    const reqData = {
      ...data,
      maintainer_can_modify: true,
      draft: false,
    };
    const prResp = await this.post(reqUrl, reqData);
    const prUrl = prResp.body.url;
    const issueNumber = prResp.body.number;
    const prInfoResp = await this.get(`${API_BASE}/repos/${this.org}/${repo}/pulls/${issueNumber}`);
    const { mergeable } = prInfoResp.body;
    let conflictLabels = [];
    if (mergeable === false) {
      conflictLabels = await getOrCreateLabels(repo, [CONFLICTS_LABEL]);
    }

    if (labels || assignees) {
      const updateUrl = `${API_BASE}/repos/${this.org}/${repo}/issues/${issueNumber}`;
      const updateData = {
        assignees,
        labels: [...labels, ...conflictLabels],
      };
      await this.post(updateUrl, updateData);
    }
    return prUrl;
  }
}

module.exports = GithubApi;
