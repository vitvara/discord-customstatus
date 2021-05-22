const request = require("request");
const config = require("./config.json");
const STATUS_URL = "https://discordapp.com/api/v8/users/@me/settings";

async function loop() {
	for (let anim of config.animation) {
		let res = await doRequest(anim.text, anim.emojiID, anim.emojiName).catch(console.error);
		if (!res) {
			// Die
			return;
		}

		await new Promise(p => setTimeout(p, anim.timeout));
	}

	loop();
}
console.log("Running...");
loop();

function doRequest(text, emojiID = null, emojiName = null) {
	return new Promise((resolve, reject) => {
		request({
			method: "PATCH",
			uri: STATUS_URL,
			headers: {
				Authorization: config.token
			},
			json: {
				custom_status: {
					text: text,
					emoji_id: emojiID,
					emoji_name: emojiName
				}
			}
		}, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}

			if (res.statusCode === 200) {
				resolve(true);
				return;
			}

			if ((res.headers["X-RateLimit-Remaining"] || 0) <= 0 && (res.headers["X-RateLimit-Reset-After"] || 0) > 0 && config.handleRatelimit) {
				// Ratelimited
				let ratelimit = res.headers["X-RateLimit-Reset-After"] * 1000;
				console.log("Hit ratelimit: " + ratelimit + "ms");

				// Try again
				setTimeout(() => {
					doRequest(text, emojiID, emojiName).then(resolve).catch(reject);
				}, ratelimit);
				return;
			}

			// Panic
			reject(new Error("Invalid Status Code: " + res.statusCode));
		});
	});
}
