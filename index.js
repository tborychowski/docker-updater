#!/usr/bin/env node
import Args from 'arg-parser';
import chalk from 'chalk';
import ora from 'ora';
import { checkForUpdates } from './lib/index.js';

const plur = no => no === 1 ? '' : 's';

function printResult (res) {
	if (!res || !res.length) return;

	res.forEach(c => {
		if (!c) return;
		let info = '';

		if (c.error) info = chalk.red(c.error || '');
		else info = c.hasUpdate ? chalk.yellow('Update found!') : chalk.green('Up-to-date!');

		console.log('-', c.Names + ':', info);
	});

}


function run (params) {
	const spinner = ora('Checking containers...').start();
	checkForUpdates()
		.then(res => {
			let msg = '';
			if (!res || !res.length) msg = ' no containers found!';
			else {
				res.sort((a, b) => a.Names.localeCompare(b.Names));
				const withError = res.filter(i => i.error);
				const toUpd = res.filter(i => i.hasUpdate);
				const upToDate = res.filter(i => !i.hasUpdate && !i.error);

				msg = ` Found ${res.length} container${plur(res.length)}, `;

				if (toUpd.length) msg += chalk.yellow(toUpd.length + ' to update:');
				else msg += chalk.green(upToDate.length + ' up-to-date') + (params.show_all ? ':' : '.');

				if (!params.show_all) res = [...toUpd, ...withError];
			}

			spinner.succeed(msg);
			printResult(res);
		})
		.catch(e => spinner.fail(e));
}


const args = new Args('docker updater', '1.1', 'Check for updates for running docker containers.');
args.add({ name: 'show_all', switches: [ '-a', '--all' ], desc: 'Show all containers' });
if (args.parse()) run(args.params);
