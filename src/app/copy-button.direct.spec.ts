// The 22.2 way: TestBed.createDirective puts the directive on a test element directly.
import { inputBinding, outputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CLIPBOARD_WRITE, CopyButton } from './copy-button';

describe('CopyButton, with createDirective', () => {
  const write = vi.fn(async (_text: string) => {});

  beforeEach(() => {
    write.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: CLIPBOARD_WRITE, useValue: write }],
    });
  });

  it('copies the bound text, shows Copied, emits copied', async () => {
    const copiedText: string[] = [];
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [
        inputBinding('appCopy', () => 'npm i'),
        outputBinding<string>('copied', (text) => copiedText.push(text)),
      ],
    });
    await fixture.whenStable();
    const button = fixture.nativeElement as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(write).toHaveBeenCalledWith('npm i');
    expect(button.dataset['state']).toBe('copied');
    expect(button.getAttribute('aria-label')).toBe('Copied');
    expect(copiedText).toEqual(['npm i']);
  });

  it('copies the new text after the input changes', async () => {
    const text = signal('npm i');
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', text)],
    });
    await fixture.whenStable();
    text.set('npm test');
    await fixture.whenStable();
    (fixture.nativeElement as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(write).toHaveBeenCalledWith('npm test');
  });

  it('uses the label input while idle', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [
        inputBinding('appCopy', () => 'npm i'),
        inputBinding('label', () => 'Copy the install command'),
      ],
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Copy the install command');
  });

  it('is disabled while there is nothing to copy', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => '')],
    });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLButtonElement).disabled).toBe(true);
  });

  it('goes back to idle after resetAfter ms', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i'), inputBinding('resetAfter', () => 1000)],
    });
    await fixture.whenStable();
    vi.useFakeTimers();
    const button = fixture.nativeElement as HTMLButtonElement;
    button.click();
    await vi.advanceTimersByTimeAsync(999);
    expect(button.dataset['state']).toBe('copied');
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(button.dataset['state']).toBe('idle');
    vi.useRealTimers();
  });
});
