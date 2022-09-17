const axios = require('axios');
const {run, toJson} = require('./util');

let GH_TOKEN = 'ghp_123';
let GH_ERROR = '';


function getImages () {
	const cmd = 'docker image ls --digests  --format "{{json .}}"';
	return run(cmd)
		.then(toJson)
		.then(images => images.filter(i => i.Digest !== '<none>'));
}

function getContainers () {
	const cmd = 'docker container ls --no-trunc --format "{{json .}}"';
	return run(cmd).then(toJson);
}

function findImage (container, images) {
	let [name, tag] = container.Image.split(':');
	tag = tag || 'latest';
	let shortname = name.split('/');
	if (shortname.length > 2) shortname = shortname.slice(1);
	if (shortname[0] === 'library') shortname = shortname.slice(1);
	shortname = shortname.join('/');
	return images.find(i => {
		return (i.Repository === name || i.Repository === shortname) && i.Tag === tag;
	});
}

function getTag (container) {
	if (!container || !container.Image) return;
	const {Repository, Tag} = container.Image;
	let repo = Repository.split('/');

	if (repo.length <= 2) return getDockerHubTag(container);

	if (repo[0] === 'ghcr.io') return getGhcrTag(container);

	container.nonDockerhub = true;
	container.hasUpdate = false;
	return container;
}

function getGhcrTag (container) {
	if (!GH_TOKEN) return container;
	const {Repository, Tag} = container.Image;
	const [, org, repo] = Repository.split('/');
	const headers = {
		Accept: 'application/vnd.github+json',
		Authorization: 'Bearer ' + GH_TOKEN,
	};
	const url = `https://api.github.com/users/${org}/packages/container/${repo}/versions`;
	return axios.get(url, {headers})
		.then(({data}) => {
			const tag = container.Image.Tag || 'latest';
			const img = data.find(img => img.metadata.container.tags.includes(tag));
			if (img) {
				const isLocalOlder = +img.updated_at > +container.Image.CreatedAt;
				const isHashDifferent = img.name !== container.Image.Digest;
				container.hasUpdate = isHashDifferent && isLocalOlder;
				container.Hub = data;
			}
			return container
		})
		.catch(e => GH_ERROR = 'GitHub error: ' + e.response.data.message);
}


function getDockerHubTag (container) {
	const {Repository, Tag} = container.Image;
	let repo = Repository.split('/');

	if (repo.length === 1) repo = 'library/' + Repository;
	else repo = Repository;

	const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/${Tag}`;

	// alt api
	// const [org, repoName] = repo.split('/');
	// const url = `https://hub.docker.com/v2/namespaces/${org}/repositories/${repoName}/tags/${Tag}`;

	return axios.get(url)
		.then(({data}) => {
			data.last_updated = new Date(data.last_updated);
			const img = data.images.find(i => i.architecture === 'amd64');
			const isHashDifferent = img.digest !== container.Image.Digest;
			const isLocalOlder = +img.last_pushed > +container.Image.CreatedAt;
			container.hasUpdate = isHashDifferent && isLocalOlder;
			container.Hub = data;
			return container;
		})
		.catch(() => {});

}


function checkForUpdates (token) {
	if (token) GH_TOKEN = token;
	return Promise.all([getImages(), getContainers()])
		.then(([images, containers]) => {
			containers.forEach(c => {
				c.Image = findImage(c, images);
			});
			return containers;
		})
		.then(containers => Promise.all(containers.map(getTag)))
		.then(tags => {
			if (GH_ERROR) throw GH_ERROR;
			return tags.filter(t => !!t);
		});
}


module.exports = {
	checkForUpdates,
};
