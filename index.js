#!/usr/bin/env node
const Args = require('arg-parser');
const chalk = require('chalk');
const ora = require('ora');
const {docker} = require('./lib');

const plur = no => no === 1 ? '' : 's';

function run (params) {
	const spinner = ora('Checking containers...').start();
	docker
		.checkForUpdates()
		.then(res => {
			let msg = '';
			if (!res || !res.length) msg = ' no containers found!';
			else {
				const toUpd = res.filter(i => i.hasUpdate);
				if (params.show_all) msg = ` Found ${res.length} container${plur(res.length)}:`;
				else msg = ` Found ${toUpd.length} container${plur(toUpd.length)} to update:`;
				if (!params.show_all) res = toUpd;
			}
			spinner.succeed(msg);

			res.forEach(c => {
				if (!c) return;
				const upd = c.hasUpdate ? chalk.yellow('Update found!') : chalk.green('Up-to-date!');
				console.log('-', c.Names + ':', upd);
			});
		});
}


const args = new Args('docker updater', '1.1', 'Check for updates for running docker containers.');
// args.add({ name: 'pull', switches: [ '-p', '--pull' ], desc: 'Pull the image' });
args.add({ name: 'show_all', switches: [ '-a', '--all' ], desc: 'Show all containers' });
args.add({ name: 'image', desc: 'Image name, e.g. tborychowski/sermon' });
if (args.parse()) run(args.params);
