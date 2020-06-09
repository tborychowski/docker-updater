const {exec} = require('child_process');
const dayjs = require('dayjs');


function run (cmd) {
	return new Promise((resolve, reject) => {
		exec(cmd, (err, stdout, stderr) => {
			if (err || stderr) return reject(err || stderr);
			resolve(stdout);
		});
	});
}

function toJson (lines) {
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


module.exports = {
	run,
	toJson
};
