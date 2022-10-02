import axios from 'axios';

const arch = process.arch.replace('x', 'amd');
const tolerance = 1000 * 60 * 60 * 2;	// 2h in ms (docker hub is weird and needs some tolerance)

function checkUpdate (container) {
	let tagDate = container.tag.last_pushed ? new Date(container.tag.last_pushed) : null;
	if (tagDate) tagDate = +tagDate - tolerance;
	const isLocalOlder = tagDate ? tagDate > +container.Image.CreatedAt : false;
	const isHashDifferent = container.tag.digest !== container.Image.Digest;
	return isHashDifferent && isLocalOlder;
}


export function getTag (container) {
	let {Repository, Tag} = container.Image;

	if (Repository.split('/').length === 1) Repository = 'library/' + Repository;
	if (!Tag || Tag === '<none>') Tag = 'latest';

	const url = `https://registry.hub.docker.com/v2/repositories/${Repository}/tags/${Tag}`;

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
