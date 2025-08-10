'use strict';

const { defineExtension } = require('azot');

module.exports = defineExtension({
  canHandle: (url) => new URL(url).hostname.includes('tiktok.com'),

  fetchContentMetadata: async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch TikTok page. Status: ${response.status}`);
      return [];
    }

    const html = await response.text();

    const urlMatcher = /"downloadAddr":"([^"]+)"/;
    const downloadAddrMatch = html.match(urlMatcher);

    if (!downloadAddrMatch || !downloadAddrMatch[1]) {
      console.error('Could not find the video download address (downloadAddr) in the page source.');
      return [];
    }

    const videoUrl = downloadAddrMatch[1].replace(/\\u002F/g, '/');

    const titleMatcher = /"desc":"([^"]*)"/;
    const titleMatch = html.match(titleMatcher);

    let title = 'TikTok Video';
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    }

    return [
      {
        title: title,
        source: {
          url: videoUrl,
          headers: {
            Referer: 'https://www.tiktok.com/',
            Cookie: document.cookie,
          },
        },
      },
    ];
  },
});
