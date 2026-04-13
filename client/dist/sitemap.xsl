<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" indent="yes" encoding="UTF-8" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap — Kritano</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; background: #f8fafc; padding: 2rem; }
          .header { max-width: 960px; margin: 0 auto 2rem; }
          .header h1 { font-size: 1.5rem; color: #4f46e5; margin-bottom: 0.25rem; }
          .header p { color: #64748b; font-size: 0.875rem; }
          table { max-width: 960px; margin: 0 auto; width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          th { background: #4f46e5; color: #fff; text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 0.6rem 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #f1f5f9; }
          a { color: #4f46e5; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .priority { text-align: center; }
          .freq { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kritano Sitemap</h1>
          <p><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /> URLs</p>
        </div>
        <table>
          <tr>
            <th>URL</th>
            <th>Last Modified</th>
            <th class="freq">Frequency</th>
            <th class="priority">Priority</th>
          </tr>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a></td>
              <td><xsl:value-of select="substring(sitemap:lastmod, 1, 10)" /></td>
              <td class="freq"><xsl:value-of select="sitemap:changefreq" /></td>
              <td class="priority"><xsl:value-of select="sitemap:priority" /></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
