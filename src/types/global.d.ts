declare module "child_process" {
	export interface ExecException {
		stdout?: string;
		stderr?: string;
	}
}
