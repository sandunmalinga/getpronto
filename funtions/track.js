const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
  const trackingNumber = event.queryStringParameters.trackingNumber;

  if (!trackingNumber) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Tracking number not provided' }),
    };
  }

  let browser = null;

  try {
    // Launch puppeteer with AWS Lambda-compatible Chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.goto('https://www.prontolanka.lk/', { waitUntil: 'networkidle2' });
    await page.type('#TextBox3', trackingNumber);
    await page.evaluate(() => document.querySelector('#LinkButton1').click());
    await page.waitForSelector('.contactForm.track-form.mb-0 table', { timeout: 10000 });
    await page.waitForTimeout(5000);

    const tableHTML = await page.evaluate(() => {
      const table = document.querySelector('.contactForm.track-form.mb-0 table');
      return table ? table.outerHTML : null;
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, table: tableHTML }),
    };
  } catch (error) {
    if (browser) await browser.close();
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Error during tracking' }),
    };
  }
};
