// The old way: a test-only component whose template puts the directive on a button.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CLIPBOARD_WRITE, CopyButton } from './copy-button';

@Component({
  imports: [CopyButton],
  template: `
    <button [appCopy]="text()" [label]="label()" [resetAfter]="resetAfter()"
            (copied)="copiedText.push($event)">Copy</button>`,
})
class TestHost {
  text = signal('npm i');
  label = signal('Copy to clipboard');
  resetAfter = signal(2000);
  copiedText: string[] = [];
}

describe('CopyButton, with a host component', () => {
  const write = vi.fn(async (_text: string) => {});

  beforeEach(() => {
    write.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: CLIPBOARD_WRITE, useValue: write }],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    return { fixture, host: fixture.componentInstance, button };
  }

  it('copies the bound text, shows Copied, emits copied', async () => {
    const { fixture, host, button } = await setup();
    button.click();
    await fixture.whenStable();
    expect(write).toHaveBeenCalledWith('npm i');
    expect(button.dataset['state']).toBe('copied');
    expect(button.getAttribute('aria-label')).toBe('Copied');
    expect(host.copiedText).toEqual(['npm i']);
  });

  it('copies the new text after the input changes', async () => {
    const { fixture, host, button } = await setup();
    host.text.set('npm test');
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();
    expect(write).toHaveBeenCalledWith('npm test');
  });

  it('uses the label input while idle', async () => {
    const { fixture, host, button } = await setup();
    host.label.set('Copy the install command');
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Copy the install command');
  });

  it('is disabled while there is nothing to copy', async () => {
    const { fixture, host, button } = await setup();
    host.text.set('');
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('goes back to idle after resetAfter ms', async () => {
    const { fixture, host, button } = await setup();
    host.resetAfter.set(1000);
    await fixture.whenStable();
    vi.useFakeTimers();
    button.click();
    await vi.advanceTimersByTimeAsync(999);
    expect(button.dataset['state']).toBe('copied');
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(button.dataset['state']).toBe('idle');
    vi.useRealTimers();
  });
});
