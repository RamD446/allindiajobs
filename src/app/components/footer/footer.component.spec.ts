import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent installation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('shows manual installation steps when no native prompt is available', async () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    const installButton: HTMLButtonElement = fixture.nativeElement.querySelector('.install-btn');
    expect(installButton.textContent).toContain('Install app');
    expect(installButton.classList.contains('install-btn--manual')).toBe(true);

    installButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#footer-install-instructions').textContent)
      .toContain(fixture.componentInstance.isIos ? 'Safari' : 'browser menu');
  });

  it('uses the browser install prompt and hides the button after installation', async () => {
    const fixture = TestBed.createComponent(FooterComponent);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' })
    });

    fixture.componentInstance.onBeforeInstallPrompt(event);
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.showInstallBtn).toBe(true);
    await fixture.componentInstance.installApp();
    expect(prompt).toHaveBeenCalledOnce();
    fixture.componentInstance.onAppInstalled();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.install-btn')).toBeNull();
  });
});
