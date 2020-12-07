# tpr

thimble pr utils

<!-- toc -->

- [Usage](#usage)
- [Options](#Options)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g https://github.com/d2bot/tpr.git
$ ./bin/run -r demo -g d2bot
$ tpr (-v|--version|version)
tpr/0.0.1 darwin-x64 node-v10.15.3
USAGE
  $ tpr OPTIONS
```

<!-- usagestop -->

<!-- options -->

# Options

```sh-session
  -a, --assignees=assignees  assignees, split by comma
  -f, --from=from            [default: master] pr from branch, default: master
  -f, --to=to                [default: release] pr to branch, default: release
  -g, --org=org              [default: carasystems] github org, default: carasystems
  -h, --help                 show CLI help
  -i, --file=file            repos input file, format: json type: array
  -r, --repo=repo            single repo to create
  -t, --token=token          github token
  -v, --version              show CLI version
```

<!-- optionsstop -->

<!-- fileformat -->

# Demo File Input

```
["demo", "demo2"]
```

<!-- fileformatstop -->

<!-- democli -->

```bash
$ ./bin/run -i data/repo.json -t xxxxx
```

<!-- democlistop -->
