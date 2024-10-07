const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {
  const trackingNumber = event.queryStringParameters.trackingNumber;

  // Ensure the trackingNumber is defined
  if (!trackingNumber) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Tracking number not provided' }),
    };
  }

  let browser;
  try {
    // Launch a headless browser
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Navigate to the Pronto tracking page
    await page.goto('https://www.prontolanka.lk/#Book-Your-Pickup', { waitUntil: 'networkidle2' });

    // Enter the tracking number into #TextBox3
    await page.type('#TextBox3', trackingNumber);

    // Click the "Track" button (#LinkButton1)
    await page.evaluate(() => {
      document.querySelector('#LinkButton1').click();
    });

    // Wait for the table to load
    await page.waitForSelector('.contactForm.track-form.mb-0 table', { timeout: 10000 });

    // Add a delay to ensure the table has fully loaded
    await page.waitForTimeout(5000);

    // Extract the table HTML
    const tableHTML = await page.evaluate(() => {
      const table = document.querySelector('.contactForm.track-form.mb-0 table');
      return table ? table.outerHTML : null;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, table: tableHTML }),
    };
  } catch (error) {
    console.error('Error while tracking shipment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Error during tracking' }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
