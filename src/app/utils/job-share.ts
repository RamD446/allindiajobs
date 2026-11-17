import { Job } from '../models/job.model';

export async function shareJobMessage(job: Job, url: string): Promise<string> {
  const title = job.title || 'Untitled opportunity';
  const lines = [`\u{1F4BC} ${title}`, `Link: ${url}`];
  const dateLabel = (value: string): string => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };
  if (job.lastDateToApply) lines.push(`Apply by: ${dateLabel(job.lastDateToApply)}`);
  if (job.walkInDate) lines.push(`Walk-in: ${dateLabel(job.walkInDate)}`);
  lines.push('', 'Share with job seekers looking for their next opportunity.');
  const text = lines.join('\n');

  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return '';
    }
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard sharing is not available in this browser.');
    }
    await navigator.clipboard.writeText(text);
    return 'Job message copied. Paste it to share.';
  } catch (error) {
    if ((error instanceof DOMException || error instanceof Error) && error.name === 'AbortError') return '';
    console.error('Unable to share job', error);
    return 'Unable to share this job. Please try again.';
  }
}
