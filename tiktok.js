import { defineExtension } from 'azot';

export default defineExtension({
  canHandle: (url) => new URL(url).hostname.includes('tiktok.com'),

  fetchContentMetadata: async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch TikTok page. Status: ${response.status}`);
      return [];
    }

    const html = await response.text();

    const jsonString = html
      .split('<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">')[1]
      ?.split('</script>')[0];

    if (!jsonString) {
      console.error('Could not find target script tag. TikTok might have updated their page structure.');
      return [];
    }

    const data = JSON.parse(jsonString);

    const videoDetail = data['__DEFAULT_SCOPE__']?.['webapp.video-detail'];
    const videoData = videoDetail?.itemInfo?.itemStruct;

    if (!videoData) {
      console.error(
        'Could not find video data in the JSON payload. The content might be unavailable or the structure has changed.'
      );
      if (videoDetail?.statusMsg) {
        console.error(`Error ${videoDetail.statusCode}: ${videoDetail.statusMsg}`);
      }
      return [];
    }

    const title = videoData.desc || 'TikTok Video';
    // The direct video URL without a watermark.
    const videoUrl = videoData.video?.playAddr;

    if (!videoUrl) {
      console.error('Could not find a video URL (playAddr) in the JSON payload.');
      return [];
    }

    return [
      {
        title: title,
        source: {
          url: videoUrl,
          headers: {
            referer: 'https://www.tiktok.com/',
            cookie: document.cookie,
          },
        },
      },
    ];
  },
});
