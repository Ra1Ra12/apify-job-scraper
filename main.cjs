const fs = require('fs');
const path = require('path');
const axios = require('axios');

const jsonFile = process.env.JSON_FILE || path.join(__dirname, 'default-fallback.json');
console.log("Using JSON file:", jsonFile);
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

async function postToTrello(item) {
    console.log("Item debug:", item);

    const title = item.metadata?.title || 'Untitled Job';
    const description = item.metadata?.description || 'No job description available.';
    const jobUrl = item.url || item.crawl?.loadedUrl || '';
    const companyUrl = item.crawl?.referrerUrl || '';

    const card = {
        name: title.slice(0, 100),
        desc: `**Description**: ${description}\n\n**Company Site**: ${companyUrl}\n\n**Apply here**: ${jobUrl}`,
        idList: TRELLO_LIST_ID,
        key: TRELLO_KEY,
        token: TRELLO_TOKEN
    };

    try {
        const response = await axios.post('https://api.trello.com/1/cards', card);
        console.log(`✅ Posted to Trello: ${response.data.name}`);
    } catch (err) {
        console.error('❌ Failed to post to Trello:', err.message);
    }
}

async function run() {
    for (const item of data) {
        await postToTrello(item);
    }
}

run();


