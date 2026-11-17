import { vi } from 'vitest';
import { Job } from '../models/job.model';
import { shareJobMessage } from './job-share';

const job: Job = {
  id: 'bank-job', title: 'Bank analyst', company: 'Bank', description: '',
  createdDate: '2026-11-17', lastDateToApply: '2026-12-01', walkInDate: '2026-11-25'
};
const url = 'https://example.test/job/bank-job/bank-analyst';
const expectedMessage = [
  '\u{1F4BC} Bank analyst',
  `Link: ${url}`,
  'Apply by: 1 December 2026',
  'Walk-in: 25 November 2026',
  '',
  'Share with job seekers looking for their next opportunity.'
].join('\n');

describe('job sharing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shares the title, link, available dates and footer through native sharing', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    await shareJobMessage(job, url);
    expect(share).toHaveBeenCalledWith({ title: job.title, text: expectedMessage });
  });

  it('copies the same complete message when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await shareJobMessage(job, url)).toBe('Job message copied. Paste it to share.');
    expect(writeText).toHaveBeenCalledWith(expectedMessage);
  });

  it('omits missing dates instead of displaying placeholders', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    await shareJobMessage({ ...job, lastDateToApply: '', walkInDate: undefined }, url);
    expect(share).toHaveBeenCalledWith({
      title: job.title,
      text: `\u{1F4BC} Bank analyst\nLink: ${url}\n\nShare with job seekers looking for their next opportunity.`
    });
  });

  it('reports clipboard failures instead of claiming the message was copied', async () => {
    const failure = new Error('Permission denied');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(failure) } });
    expect(await shareJobMessage(job, url)).toBe('Unable to share this job. Please try again.');
    expect(log).toHaveBeenCalledWith('Unable to share job', failure);
  });

  it('does not report cancellation as a sharing failure or copy unexpectedly', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')),
      clipboard: { writeText }
    });
    expect(await shareJobMessage(job, url)).toBe('');
    expect(writeText).not.toHaveBeenCalled();
  });
});
