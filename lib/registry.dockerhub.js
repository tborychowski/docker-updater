import axios from 'axios';

const arch = process.arch.replace('x', 'amd');

function checkUpdate (container) {
	const isHashDifferent = container.tag.digest !== container.Image.Digest;
	const isLocalOlder = +container.tag.last_pushed > +container.Image.CreatedAt;

	return isHashDifferent && isLocalOlder;
}


export function getTag (container) {
	const {Repository, Tag} = container.Image;
	let repo = Repository.split('/');

	if (repo.length === 1) repo = 'library/' + Repository;
	else repo = Repository;

	const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/${Tag}`;

	// alt api
	// const [org, repoName] = repo.split('/');
	// const url = `https://hub.docker.com/v2/namespaces/${org}/repositories/${repoName}/tags/${Tag}`;

	return axios.get(url)
		.then(({data}) => data.images.find(i => i.architecture === arch))
		.then((tag) => {
			if (tag) {
				container.tag = tag;
				container.hasUpdate = checkUpdate(container);
			}
			return container;
		})
		.catch(() => {
			container.error = 'DockerHub API server error';
			return container;
		});
}
