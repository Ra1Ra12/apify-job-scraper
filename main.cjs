const fs = require('fs');
const path = require('path')
const axios = require ('axios')

const jsonFile = path.join(__dirname, 'datest_website-content-crawler_2025-07-21_15-51-48-849.json');

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

async function postToTrello(item) {
    const title = (item.metadata && item.metadata.title) ? item.metadata.title: 'untitled';
    const description = (item.metadata && item.metadata.description) ? item.metadata.description : '';
    const url = item.url || ';
        
    const card = {
            name: title.slice(0, 100),
            desc: '${description}\n\nSource: ${url}',
            idList: TRELLO_LIST_ID,
            key: TRELLO_KEY,
            takon: TRELLO_TOKEN
};

try {
    const response = await axios.post('https://api.trello.com/1/cards', card);
    console.log('Posted to Trello: ${response.data.name}');
  } catch (err) {
    console.error('Failed to post to Trello:', err.message);
  }
}

async function run() {
  for (const item of data) {
    await postToTrello(item);
  }
}

run();
