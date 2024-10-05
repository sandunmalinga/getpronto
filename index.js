const puppeteer = require('puppeteer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

async function trackShipment(trackingNumber) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required flags for Puppeteer on Render
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

    await browser.close();
    return tableHTML;
  } catch (error) {
    console.error('Error while tracking shipment:', error);
    await browser.close();
    return null;
  }
}

// Route to handle tracking requests
app.get('/track/:trackingNumber', async (req, res) => {
  const trackingNumber = req.params.trackingNumber;

  if (!trackingNumber) {
    return res.json({ success: false, message: 'Tracking number not provided' });
  }

  const tableHTML = await trackShipment(trackingNumber);

  if (tableHTML) {
    res.json({ success: true, table: tableHTML });
  } else {
    res.json({ success: false, message: 'Failed to retrieve tracking information' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
