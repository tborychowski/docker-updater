const axios = require('axios');
const {run, toJson} = require('./util');

function getImages () {
	const cmd = 'docker image ls --digests  --format "{{json .}}"';
	return run(cmd).then(toJson);
}

function getContainers () {
	const cmd = 'docker container ls --no-trunc --format "{{json .}}"';
	return run(cmd).then(toJson);
}

function findImage (container, images) {
	let [name, tag] = container.Image.split(':');
	tag = tag || 'latest';
	return images.find(i => (i.Repository === name && i.Tag === tag));
}

function getTag (container) {
	const {Repository, Tag} = container.Image;
	let repo = Repository.split('/');
	if (repo.length > 2) {
		container.hasUpdate = false;
		container.nonDockerhub = true;
		return container;
	}
	if (repo.length === 1) repo = 'library/' + Repository;
	else repo = Repository;

	const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/${Tag}`;
	return axios.get(url)
		.then(({data}) => {
			data.last_updated = new Date(data.last_updated);
			const img = data.images.find(i => i.architecture === 'amd64');
			const isHashDifferent = img.digest !== container.Image.Digest;
			// is date newer (with the tolerance of 6h)
			const six_hours = 6 * 60 * 60 * 1000;
			const isLocalOlder = +data.last_updated > (+container.Image.CreatedAt + six_hours);
			container.hasUpdate = isHashDifferent && isLocalOlder;
			container.Hub = data;
			return container;
		})
		// .catch(e => console.log('\n', url, e.response.statusText));
		.catch(() => {});
}


function checkForUpdates () {
	return Promise.all([getImages(), getContainers()])
		.then(([images, containers]) => {
			containers.forEach(c => {
				c.Image = findImage(c, images);
			});
			return containers;
		})
		.then(containers => Promise.all(containers.map(getTag)));
}


module.exports = {
	checkForUpdates,
};
