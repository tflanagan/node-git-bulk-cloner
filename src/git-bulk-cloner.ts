'use strict';

/* Dependencies */
import {
	mkdirSync
} from 'fs';
import {
	join
} from 'path';
import axios from 'axios';
import Debug from 'debug';
import {
	exec as execNode
} from 'child_process';
import {
	Throttle
} from 'generic-throttle';

const pkg = require('../package.json');

/* Debug */
const debug = Debug([
	pkg.name,
	'main'
].join(':'));

/* Globals */
const throttle = new Throttle(5);

/* Helpers */
function buildUrl(settings: GitBulkCloner, path: string): string {
	let url = `${settings.server}/${path}`;

	url += (url.indexOf('?') !== -1 ? '&' : '?') + `private_token=${settings.token}`;

	return url.replace(/(?<!https:)\/\//g, '/');
}

async function cloneProject(settings: GitBulkCloner, project: GitLabProject, path: string[]){
	await throttle.acquire(async () => {
		path.unshift(settings.destination);
		path.push(project.path);

		const fullpath = join.apply(null, path);

		mkdirSync(fullpath, {
			recursive: true
		});

		try {
			debug(`Cloning "${project.name}" to "${fullpath}"...`);

			await exec(`git clone ${project.ssh_url_to_repo} "${fullpath}"`);
		}catch(err){
			if(!err.stderr.match(/already exists/) && !err.stderr.match(/Cloning/)){
				throw err;
			}
		}
	});
}

async function exec(cmd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execNode(cmd, (err, stdout, stderr) => {
			if(err){
				err.stdout = stdout;
				err.stderr = stderr;

				return reject(err);
			}

			if(stderr && !stderr.match(/ExperimentalWarning/)){
				err = new Error(`Command failed: ${cmd}`);

				if(err !== null){
					err.stdout = stdout;
					err.stderr = stderr;
				}

				return reject(err);
			}

			resolve(stdout);
		});
	});
};

function getGroupProjects(settings: GitBulkCloner, groupId: number | string): Promise<GitLabProject[]> {
	return paginateGitLabRequest<GitLabProject[]>(settings, `api/v4/groups/${groupId}/projects?simple=true&include_subgroups=false&with_shared=false&sort=asc&order_by=id`);
}

function getGroups(settings: GitBulkCloner): Promise<GitLabGroup[]> {
	return paginateGitLabRequest<GitLabGroup[]>(settings, `api/v4/groups?all_available=true&top_level_only=true&sort=asc&order_by=id`);
}

function getGroupSubGroups(settings: GitBulkCloner, groupId: number | string): Promise<GitLabGroup[]> {
	return paginateGitLabRequest<GitLabGroup[]>(settings, `api/v4/groups/${groupId}/subgroups?all_available=true&sort=asc&order_by=id`);
}

async function paginateGitLabRequest<T>(settings: GitBulkCloner, path: string): Promise<T> {
	const perPage = 100;
	let page = 1;
	let url = buildUrl(settings, path);
	let done = false;
	let results: any;

	url += url.indexOf('?') === -1 ? '?' : '&';

	while(!done){
		const lUrl = `${url}page=${page}&per_page=${perPage}`;
		const lResults = (await axios.get(lUrl)).data;

		if(lResults instanceof Array){
			if(!(results instanceof Array)){
				results = [];
			}

			if(results instanceof Array){
				results = results.concat(lResults);
			}
		}


		if(lResults.length < perPage){
			done = true;
		}else{
			++page;
		}
	}

	return results;
}

async function processGroup(settings: GitBulkCloner, groupId: number | string, path?: string[]){
	let subGroups: GitLabGroup[] = [],
		projects: GitLabProject[] = [];

	await throttle.acquire(async () => {
		debug(`Loading Group "${groupId}"`);

		[
			subGroups,
			projects
		] = await Promise.all([
			getGroupSubGroups(settings, groupId),
			getGroupProjects(settings, groupId)
		]);
	});

	if(!path){
		path = [];
	}

	await Promise.all(subGroups.map((subGroup) => {
		return processGroup(settings, subGroup.id, path!.concat(subGroup.path));
	}).concat(projects.map((project) => {
		return cloneProject(settings, project, path!.concat());
	})));
}

/* Export */
export = async function gitBulkCloner(settings: GitBulkCloner){
	throttle.requestsPerPeriod = +(settings.concurrency || 5);

	if(settings.group){
		await processGroup(settings, settings.group);
	}else{
		const groups = await getGroups(settings);

		await Promise.all(groups.map((group) => {
			return processGroup(settings, group.id, [ group.path ]);
		}));
	}
}

