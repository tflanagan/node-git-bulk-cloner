git-bulk-cloner
===============

```
$ npm install -g git-bulk-cloner
```

```
Usage: git-bulk-cloner [options]

Options:
  -V, --version                           output the version number, required
  -s, --server <url>                      GitLab Server URL, required
  -t, --token <token>                     GitLab Private Token, required
  -g, --group <group id or name>          Group or Sub-group to clone, required
  -d, --destination <destination folder>  Destination folder for cloned repos,
                                          defaults to current directory
  -h, --help                              display help for command
```

Example usage:

```
$ git-bulk-cloner -s https://gitlab.datacollaborative.com/ -t XXXXXXXXXXXXXXXXXXXX -g mpw-techs -d ~/mpw-techs/
```
