import { getContainers, getImages, findContainerImage } from './util.js';

import * as github from './registry.github.js';
import * as dockerhub from './registry.dockerhub.js';
import * as gitlab from './registry.gitlab.js';



function getTag (container) {
	if (!container || !container.Image) return;
	const { Repository } = container.Image;
	let repo = Repository.split('/');

	let registry;

	if (repo.length <= 2) registry = dockerhub;
	if (repo[0] === 'ghcr.io') registry = github;
	if (repo[0] === 'registry.gitlab.com') registry = gitlab;

	if (registry) return registry.getTag(container);

	container.hasUpdate = false;
	container.error = 'unsupported registry: ' + repo[0];
	return container;
}


function getContainersTags (containers) {
	return Promise.all(containers.map(getTag));
}


function matchImages ([images, containers]) {
	containers.forEach(c => c.Image = findContainerImage(c, images));
	return containers;
}



export function checkForUpdates () {
	return Promise.all([getImages(), getContainers()])
		.then(matchImages)
		.then(getContainersTags)
		.then(tags => tags.filter(t => !!t))
		.catch(e => console.log(e));
}
