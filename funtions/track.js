const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

async function trackShipment(trackingNumber) {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath,
    headless: true,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.prontolanka.lk/', { waitUntil: 'networkidle2' });

    // Enter the tracking number
    await page.type('#TextBox3', trackingNumber);

    // Click the "Track" button
    await page.evaluate(() => {
      document.querySelector('#LinkButton1').click();
    });

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
    await browser.close();
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Error during tracking', error: error.message }),
    };
  }
}

// Export the handler for Netlify
exports.handler = async (event) => {
  const trackingNumber = event.queryStringParameters.trackingNumber;

  if (!trackingNumber) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Tracking number not provided' }),
    };
  }

  return await trackShipment(trackingNumber);
};
