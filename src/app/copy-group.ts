import { Directive } from '@angular/core';

interface Resettable {
  reset(): void;
}

/**
 * <div appCopyGroup> ... several button[appCopy] ... </div>
 *
 * Keeps one "Copied" state per group: when a button copies, the others reset.
 * The buttons find the group through the element injector, so this only works
 * when the group sits on an ancestor element in a template.
 */
@Directive({ selector: '[appCopyGroup]' })
export class CopyGroup {
  private readonly buttons = new Set<Resettable>();

  register(button: Resettable): void {
    this.buttons.add(button);
  }

  unregister(button: Resettable): void {
    this.buttons.delete(button);
  }

  copiedBy(source: Resettable): void {
    for (const b of this.buttons) {
      if (b !== source) b.reset();
    }
  }
}
