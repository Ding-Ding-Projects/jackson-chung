import {execFileSync} from 'node:child_process';
export function assertBuildSource(cwd=process.cwd()) {
 const unresolved=execFileSync('git',['diff','--name-only','--diff-filter=U'],{cwd,encoding:'utf8'}).trim();
 if(unresolved)throw Error('Build source contains unresolved merge conflicts. Resolve and commit before producing a source-bound artifact.');
 const changes=execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd,encoding:'utf8'}).trim();
 if(changes)throw Error('Build source has uncommitted tracked changes or untracked source files. Commit the candidate before producing a source-bound artifact.');
 return execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
}
