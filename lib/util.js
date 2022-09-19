import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {exec} from 'child_process';
import dayjs from 'dayjs';
import dotenv from 'dotenv';

const __dirname = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');

dotenv.config({ path: __dirname });

export const GH_TOKEN = process.env.GH_TOKEN || '';
export const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';


export function run (cmd) {
	return new Promise((resolve, reject) => {
		exec(cmd, (err, stdout, stderr) => {
			if (err || stderr) return reject(err || stderr);
			resolve(stdout);
		});
	});
}


export function toJson (lines) {
	lines = lines
		.trim()
		.split('\n')
		.join(',');

	let json;
	try { json = JSON.parse(`[${lines}]`); }
	catch { json = ''; }

	json.forEach(item => {
		// 2020-04-19 14:15:23 +0100 IST
		const s = item.CreatedAt.slice(0, -4);
		item.CreatedAt = dayjs(s, 'YYYY-MM-DD HH:mm:ss ZZ').toDate();
	});

	return json;
}



export function getImages () {
	return run('docker image ls --digests  --format "{{json .}}"')
		.then(toJson)
		.then(images => images.filter(i => i.Digest !== '<none>'));
}


export function getContainers () {
	return run('docker container ls --no-trunc --format "{{json .}}"').then(toJson);
}


export function findContainerImage (container, images) {
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
