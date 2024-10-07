const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber) {
  const browser = await puppeteer.launch({
    headless: true, // Set to false to open the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // For some environments
  });
  const page = await browser.newPage();

  try {
    // Navigate to the Pronto tracking page
    await page.goto('https://www.prontolanka.lk/', { waitUntil: 'networkidle2' });

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

    console.log({ success: true, table: tableHTML });
    await browser.close();
  } catch (error) {
    console.error('Error while tracking shipment:', error);
    await browser.close();
  }
}

// Hardcoded tracking number for local testing
const trackingNumber = 'COD2542820';

trackShipment(trackingNumber);
