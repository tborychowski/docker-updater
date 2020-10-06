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
				res.sort((a, b) => a.Names.localeCompare(b.Names));
				const toUpd = res.filter(i => i.hasUpdate);
				msg = ` Found ${res.length} container${plur(res.length)}, `;

				if (toUpd.length) msg += chalk.yellow(toUpd.length + ' to update:');
				else msg += chalk.green('up-to-date') + (params.show_all ? ':' : '.');

				if (!params.show_all) res = toUpd;
			}

			spinner.succeed(msg);
			if (res && res.length) res.forEach(c => {
				if (!c) return;
				const upd = c.hasUpdate ? chalk.yellow('Update found!') : chalk.green('Up-to-date!');
				console.log('-', c.Names + ':', upd);
			});
		});
}


const args = new Args('docker updater', '1.1', 'Check for updates for running docker containers.');
// args.add({ name: 'pull', switches: [ '-p', '--pull' ], desc: 'Pull the image' });
args.add({ name: 'show_all', switches: [ '-a', '--all' ], desc: 'Show all containers' });
if (args.parse()) run(args.params);
