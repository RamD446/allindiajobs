import { youtubeEmbedUrl } from './youtube';

describe('YouTube video URLs', () => {
  it('extracts the video from a watch URL containing playlist parameters', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=8Tr_JiktpBk&list=PLVlQHNRLflP-jc5Fbhfdhzv52AWYq836j&index=2'))
      .toBe('https://www.youtube-nocookie.com/embed/8Tr_JiktpBk');
  });

  it('supports short links, Shorts, live and embedded video links', () => {
    for (const url of [
      'https://youtu.be/8Tr_JiktpBk',
      'https://www.youtube.com/shorts/8Tr_JiktpBk',
      'https://www.youtube.com/live/8Tr_JiktpBk',
      'https://www.youtube.com/embed/8Tr_JiktpBk'
    ]) {
      expect(youtubeEmbedUrl(url)).toBe('https://www.youtube-nocookie.com/embed/8Tr_JiktpBk');
    }
  });

  it('rejects non-YouTube URLs, unsafe protocols and invalid video IDs', () => {
    for (const url of ['', 'not a url', 'javascript:alert(1)',
      'https://youtube.com.evil.test/watch?v=8Tr_JiktpBk',
      'https://www.youtube.com/watch?v=invalid',
      'https://www.youtube.com/playlist?list=PLVlQHNRLflP',
      'ftp://www.youtube.com/watch?v=8Tr_JiktpBk']) {
      expect(youtubeEmbedUrl(url)).toBeNull();
    }
  });
});
