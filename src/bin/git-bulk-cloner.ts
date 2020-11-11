#!/usr/bin/env node

'use strict';

/* Dependencies */
import gitBulkCloner from '../git-bulk-cloner';
import Debug from 'debug';
import {
	Command
} from 'commander';

const pkg = require('../../package.json');

/* Debug */
const debug = Debug([
	pkg.name,
	'bin'
].join(':'));

/* Main */
const program = new Command('git-bulk-cloner');

program.version(pkg.version);

program.requiredOption('-s, --server <url>', 'GitLab Server URL');
program.requiredOption('-t, --token <token>', 'GitLab Private Token');
program.option('-g, --group <group id>', 'Group or Sub-group to clone, defaults to all');
program.option('-d, --destination <destination folder>', 'Destination folder for cloned repos, defaults to current directory', process.cwd());

program.parse(process.argv);

debug(program.opts());

(async () => {
	try {
		await gitBulkCloner({
			server: program.server,
			token: program.token,
			group: program.group,
			destination: program.destination
		});
	}catch(err){
		debug(err);

		console.error(err);
		process.exit(1);
	}
})();
