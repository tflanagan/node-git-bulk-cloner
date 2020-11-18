// https://docs.gitlab.com/ce/api/groups.html
interface GitLabGroup {
	id: number;
	name: string;
	path: string;
}

// https://docs.gitlab.com/ce/api/projects.html
interface GitLabProject {
	id: number;
	name: string;
	path: string;
	ssh_url_to_repo: string;
}

interface GitBulkCloner {
	server: string;
	token: string;
	group?: number;
	destination: string;
	concurrency?: number;
}
