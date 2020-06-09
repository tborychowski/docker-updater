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
	const url = `https://registry.hub.docker.com/v2/repositories/${Repository}/tags/${Tag}`;
	return axios.get(url).then(({data}) => {
		data.last_updated = new Date(data.last_updated);
		const isHashDifferent = data.images[0].digest !== container.Image.Digest;
		const isLocalOlder = data.last_updated > container.Image.CreatedAt;
		container.hasUpdate = isHashDifferent && isLocalOlder;
		container.Hub = data;
		return container;
	});
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
