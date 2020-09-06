const path = require('path');
const fs = require('fs');
const { Command, flags } = require('@oclif/command');
const { cli } = require('cli-ux');
const worker = require('./worker');

class TprCommand extends Command {
  async run() {
    const cwd = process.cwd();
    const { flags } = this.parse(TprCommand);
    const org = flags.org || 'carasystems';
    let token = flags.token;
    let file = flags.file;
    let repo = flags.repo;
    let repos = [];
    const assignees = flags.assignees || '';
    if (!repo && !file) {
      repo = await cli.prompt('Which repo to create pr');
    } else if (file) {
      if (!file.endsWith('.json')) {
        this.error('Invalid file format, should be json file');
      }
      const filePath = file.startsWith('/') ? file : path.join(cwd, file);
      if (!fs.existsSync(filePath)) {
        this.error(`File not found: ${filePath}`);
      }

      repos = require(filePath);
      if (!Array.isArray(repos)) {
        this.error(`Invalid file format, should be json array file`);
      }
    } else {
      repos = [repo];
    }

    if (!token) {
      token = await cli.prompt('Please input the github token');
    }

    this.log('\n\nWorker args shows below:');

    cli.table(
      [
        {
          k: 'token',
          v: token,
        },
        {
          k: 'org',
          v: org,
        },
        {
          k: 'repos',
          v: repos.join(','),
        },
        {
          k: 'assignees',
          v: assignees,
        },
      ],
      { k: { minWidth: 7 }, v: {} }
    );

    this.log('\n\nBegin to work....');
    cli.action.start(`Creating pull request for ${repos.length} repos`);
    const results = await worker.run(token, org, repos, assignees.split(','), flags.from, flags.to);
    cli.action.stop();
    this.log('\n\nResult list show belows:');
    cli.table(results, {
      repo: {
        minWidth: 10,
        get: (row) => row.repo,
      },
      result: {
        minWidth: 20,
        get: (row) => (row.status === 'failed' ? '🔴 Failed' : '🟢 Succeed'),
      },
      message: {
        minWidth: 40,
        get: (row) => (row.status === 'failed' ? row.error_message || row.message || row.err : row.pr_url),
      },
    });
  }
}

TprCommand.description = `Create pull requests for release
...
No Extra documentation
`;

TprCommand.flags = {
  version: flags.version({ char: 'v' }),
  help: flags.help({ char: 'h' }),
  from: flags.string({ char: 'f', default: 'master', description: 'pr from branch, default: master' }),
  to: flags.string({ char: 'f', default: 'release', description: 'pr to branch, default: release' }),
  assignees: flags.string({ char: 'a', description: 'assignees, split by comma' }),
  org: flags.string({ char: 'g', default: 'carasystems', description: 'github org, default: carasystems' }),
  repo: flags.string({ char: 'r', description: 'single repo to create' }),
  token: flags.string({ char: 't', description: 'github token' }),
  file: flags.string({ char: 'i', description: 'repos input file, format: json type: array' }),
};

module.exports = TprCommand;
