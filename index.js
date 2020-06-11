#!/usr/bin/env node
const Args = require('arg-parser');
const chalk = require('chalk');
const ora = require('ora');
const {docker} = require('./lib');


function run () {
	const spinner = ora('Checking containers...').start();
	docker
		.checkForUpdates()
		.then(res => {
			spinner.succeed(`Checked ${res.length} container${res.length > 1 ? 's' : ''}:`);
			res.forEach(c => {
				if (!c) return;
				if (!c.hasUpdate) return;
				const upd = c.hasUpdate ? chalk.yellow('Update found!') : chalk.green('Up-to-date!');
				console.log('-', c.Names + ':', upd);
			});
		});
}


const args = new Args('docker updater', '1.0', 'Check for updates for an docker image.');
args.add({ name: 'pull', switches: [ '-p', '--pull' ], desc: 'Pull the image' });
args.add({ name: 'image', desc: 'Image name, e.g. tborychowski/sermon' });
if (args.parse()) run(args.params);
