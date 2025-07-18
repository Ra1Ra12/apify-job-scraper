const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://example.com/jobs');

  const jobs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a.job-listing')).map(job => ({
      title: job.innerText,
      url: job.href
    }))
  );

  console.log(jobs);
  await browser.close();
})();