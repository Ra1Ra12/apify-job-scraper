const puppeteer = require('puppeteer');
const fetch = require('node-fetch')

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

async function postToTrello(jobTitle, jobUrl) {
    const response = await fetch('https://api.trello.com/1/cards', {
        method: 'POST'
        headers: { 'content-Type': 'application/json' },
        body: JSON.stringify({
            name: jobTitle,
            desc: jobUrl,
            idList: TRELLO_LIST_ID,
            key: TRELLO_KEY,
            takon: TRELLO_TOKEN
        })
    });

    const result = await response.json();
    console.log('Posted to Trello: ${resuklt.name}');
}
(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://example.com/jobs');
  
    const jobs = await page.evaluate (() =>
        Array.from(document.querySelectorAll('a.job-listing').map(job => ({
            title: job.innerText,
            url: job.href
        }))
     );

  console.log(jobs);
  
  for (const job of jobs) {
      await postToTrello(job.title, job.url);
  }

  await browser.close();
})();
