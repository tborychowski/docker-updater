import axios from 'axios';
import { GH_TOKEN } from './util.js';


function checkUpdate (container) {
	const isLocalOlder = +container.tag.updated_at > +container.Image.CreatedAt;
	const isHashDifferent = container.tag.name !== container.Image.Digest;

	return isHashDifferent && isLocalOlder;
}


export function getTag (container) {
	if (!GH_TOKEN) {
		container.error = 'incorrect GitHub token';
		return container;
	}

	const { Repository } = container.Image;
	const [, org, repo] = Repository.split('/');
	const headers = {
		Accept: 'application/vnd.github+json',
		Authorization: 'Bearer ' + GH_TOKEN,
	};
	const url = `https://api.github.com/users/${org}/packages/container/${repo}/versions`;
	return axios.get(url, {headers})
		.then(({data}) => {
			const tag = container.Image.Tag || 'latest';
			return data.find(_img => _img.metadata.container.tags.includes(tag));
		})
		.then((tag) => {
			if (tag) {
				container.tag = tag;
				container.hasUpdate = checkUpdate(container);
			}
			return container;
		})
		.catch(() => {
			container.error = 'GitHub API server error';
			return container;
		});
}
