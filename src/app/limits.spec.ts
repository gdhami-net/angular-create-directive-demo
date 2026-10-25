// Where createDirective stops, tried one by one.
import { Component, Directive, TemplateRef, inject, inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CLIPBOARD_WRITE, CopyButton } from './copy-button';
import { CopyGroup } from './copy-group';

@Directive({ selector: '[appTooltip]' })
class Tooltip {}

@Directive({ selector: '[appIfCopied]' })
class IfCopied {
  readonly template = inject(TemplateRef);
}

// The group behaviour only exists when two buttons share an ancestor in a template.
@Component({
  imports: [CopyButton, CopyGroup],
  template: `
    <div appCopyGroup>
      <button appCopy="npm i">Install</button>
      <button appCopy="npm test">Test</button>
    </div>`,
})
class TwoButtons {}

describe('where createDirective stops', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: CLIPBOARD_WRITE, useValue: async () => {} }],
    });
  });

  it('sets the bindings at the first change detection, not at creation', () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i')],
    });
    expect(() => fixture.directiveInstance.appCopy()).toThrow(/NG0950/);
    fixture.detectChanges();
    expect(fixture.directiveInstance.appCopy()).toBe('npm i');
  });

  it('builds a bare button: no appCopy attribute, no text, no parent component', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i')],
    });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.tagName).toBe('BUTTON');
    expect(el.hasAttribute('appCopy')).toBe(false);
    expect(el.childNodes.length).toBe(0);
    expect(el.parentElement).toBe(document.body);
  });

  it('needs a tagName when the selector has no tag', () => {
    expect(() => TestBed.createDirective(Tooltip)).toThrow(/Cannot determine tag name/);
    expect(TestBed.createDirective(Tooltip, { tagName: 'span' }).nativeElement.tagName).toBe('SPAN');
  });

  it('finds an input name typo only when the test runs', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i'), inputBinding('resetAftr', () => 5)],
    });
    await expect(fixture.whenStable()).rejects.toThrow(/NG0315/);
  });

  it('does not type-check the value either', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i'), inputBinding('resetAfter', () => 'soon')],
    });
    await fixture.whenStable();
    expect(fixture.directiveInstance.resetAfter()).toBe('soon');
  });

  it('cannot create a structural directive: there is no TemplateRef', () => {
    expect(() => TestBed.createDirective(IfCopied, { tagName: 'div' })).toThrow(/NG0201/);
  });

  it('gets no group at all without a template around it', async () => {
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i')],
    });
    await fixture.whenStable();
    expect((fixture.directiveInstance as unknown as { group: unknown }).group).toBeNull();
  });

  it('can fake the parent group through providers, but only the fake is checked', async () => {
    const group = { register: vi.fn(), unregister: vi.fn(), copiedBy: vi.fn() };
    TestBed.overrideProvider(CopyGroup, { useValue: group });
    const fixture = TestBed.createDirective(CopyButton, {
      bindings: [inputBinding('appCopy', () => 'npm i')],
    });
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).click();
    await fixture.whenStable();
    expect(group.copiedBy).toHaveBeenCalledWith(fixture.directiveInstance);
  });

  it('needs a host component to test the real group: one Copied at a time', async () => {
    const fixture = TestBed.createComponent(TwoButtons);
    await fixture.whenStable();
    const [install, test] = fixture.nativeElement.querySelectorAll('button');

    install.click();
    await fixture.whenStable();
    expect([install.dataset.state, test.dataset.state]).toEqual(['copied', 'idle']);

    test.click();
    await fixture.whenStable();
    expect([install.dataset.state, test.dataset.state]).toEqual(['idle', 'copied']);
  });
});
