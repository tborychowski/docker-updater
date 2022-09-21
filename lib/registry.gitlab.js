import axios from 'axios';
import { GITLAB_TOKEN } from './util.js';

const BASE_URL = 'https://gitlab.com/api/v4/projects/';
const tolerance = 1000 * 60 * 10;	// 10 min in ms


// 1 get project's repositories to get its ID
// https://gitlab.com/api/v4/projects/<url encoded project path>/registry/repositories

// 2. get tag details
// https://gitlab.com/api/v4/projects/<url encoded project path>/registry/repositories/<repo id>/tags/latest


function get (projectId, repoId, tag) {
	const headers = { 'PRIVATE-TOKEN': GITLAB_TOKEN };
	let url = `${BASE_URL}${projectId}/registry/repositories`;
	if (repoId) {
		url += `/${repoId}`;
		if (tag) url += `/tags/${tag}`;
	}
	return axios.get(url, { headers });
}


function findRepoId (repo, repos) {
	const repoFound = repos.find(r => r.path === repo);
	return repoFound ? repoFound.id : null;
}


function checkUpdate (container) {
	const digest = container.tag.digest;
	const isHashDifferent = digest !== container.Image.Digest;
	let tagDate = container.tag.created_at;
	if (tagDate) tagDate = +new Date(tagDate);
	if (tagDate) tagDate = tagDate - tolerance;
	const isLocalOlder = tagDate > +container.Image.CreatedAt;

	return isHashDifferent && isLocalOlder;
}


export function getTag (container) {
	const {Repository, Tag} = container.Image;
	const [, org, repoName] = Repository.split('/');
	const repo = org + '/' + repoName;
	const projectId = encodeURIComponent(repo);

	return get(projectId)
		.then(({ data }) => findRepoId(repo, data))
		.then(repoId => {
			if (!repoId) return container;
			return get(projectId, repoId, Tag);
		})
		.then(({data}) => {
			if (data) {
				container.tag = data;
				container.hasUpdate = checkUpdate(container);
			}
			return container;
		})
		.catch(() => {
			container.error = 'GitLab API server error';
			return container;
		});
}
