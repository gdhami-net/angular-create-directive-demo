import {
  Directive,
  InjectionToken,
  inject,
  input,
  output,
  signal,
  DestroyRef,
} from '@angular/core';
import { CopyGroup } from './copy-group';

/** Writes text to the clipboard. A token so tests can swap the browser API out. */
export const CLIPBOARD_WRITE = new InjectionToken<(text: string) => Promise<void>>(
  'CLIPBOARD_WRITE',
  { factory: () => (text: string) => navigator.clipboard.writeText(text) },
);

/**
 * <button [appCopy]="snippet">Copy</button>
 *
 * Copies the bound text on click, shows a "Copied" state for `resetAfter` ms,
 * and emits `copied` with the text. Inside an appCopyGroup, only the button
 * clicked last shows "Copied".
 */
@Directive({
  selector: 'button[appCopy]',
  host: {
    type: 'button',
    '(click)': 'copy()',
    '[class.copied]': 'state() === "copied"',
    '[attr.data-state]': 'state()',
    '[attr.aria-label]': 'state() === "copied" ? "Copied" : label()',
    '[disabled]': '!appCopy()',
  },
})
export class CopyButton {
  readonly appCopy = input.required<string>();
  readonly label = input('Copy to clipboard');
  readonly resetAfter = input(2000);
  readonly copied = output<string>();

  readonly state = signal<'idle' | 'copied' | 'failed'>('idle');

  private readonly write = inject(CLIPBOARD_WRITE);
  private readonly group = inject(CopyGroup, { optional: true });
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.group?.register(this);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.group?.unregister(this);
    });
  }

  async copy(): Promise<void> {
    const text = this.appCopy();
    try {
      await this.write(text);
    } catch {
      this.state.set('failed');
      return;
    }
    this.group?.copiedBy(this);
    this.state.set('copied');
    this.copied.emit(text);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reset(), this.resetAfter());
  }

  reset(): void {
    clearTimeout(this.timer);
    this.state.set('idle');
  }
}
