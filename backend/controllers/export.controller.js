import puppeteer from 'puppeteer';

export const exportPdf = async (req, res) => {
    const { items, userName } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
          .header h1 { color: #6366f1; margin: 0; }
          .header p { color: #666; margin-top: 5px; }
          .item-card { border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; }
          .item-img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-right: 20px; background: #f3f4f6; }
          .item-info { flex-grow: 1; }
          .item-name { font-size: 18px; font-weight: bold; margin: 0; color: #111; }
          .item-price { color: #059669; font-weight: 600; font-size: 16px; margin: 4px 0; }
          .item-category { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>WishFlow</h1>
          <p>${userName ? `${userName}'s Wishlist` : 'My Wishlist'}</p>
        </div>
        
        ${items.map(item => `
          <div class="item-card">
            ${item.image ? `<img class="item-img" src="${item.image}" alt="">` : '<div class="item-img"></div>'}
            <div class="item-info">
              <span class="item-category">${item.categories?.name || 'Uncategorized'}</span>
              <p class="item-name">${item.name}</p>
              <p class="item-price">₹${item.price.toLocaleString()}</p>
            </div>
          </div>
        `).join('')}

        <div class="footer">
          Generated via WishFlow App | ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        res.contentType("application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=wishlist.pdf");
        res.end(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
