const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chrome-aws-lambda');

exports.handler = async (event) => {
  const trackingNumber = event.queryStringParameters.trackingNumber;

  if (!trackingNumber) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Tracking number not provided' }),
    };
  }

  let browser;
  try {
    browser = await chrome.puppeteer.launch({
      args: [...chrome.args],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
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

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, table: tableHTML }),
    };

  } catch (error) {
    console.error('Error during tracking:', error);  // Log the error
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Error during tracking', error: error.message }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
