# angular-create-directive-demo

One Angular directive, tested two ways: with a test-only host component, and with
`TestBed.createDirective()`, which Angular added in 22.2. Plus the cases where
`createDirective` stops and a host component is still the test you want.

Companion to the post "When an Angular directive test no longer needs a host component" on
[gdhami.net](https://gdhami.net/blog/when-an-angular-directive-test-no-longer-needs-a-host-component).

## What it proves

`npm run check` runs every spec and then counts the code lines of the two
side-by-side spec files. It fails if any test fails or if the counts drift from
the numbers the post quotes.

- `src/app/copy-button.ts`: the directive. `button[appCopy]` copies its bound text on
  click, shows a Copied state (class, `data-state`, `aria-label`), emits `copied`, goes
  back to idle after `resetAfter` ms, and is disabled while the text is empty. The
  clipboard is behind the `CLIPBOARD_WRITE` token so tests use a fake.
- `src/app/copy-group.ts`: `[appCopyGroup]` on a wrapper keeps one Copied button at a time.
- `src/app/copy-button.host.spec.ts`: five tests through a `TestHost` component.
- `src/app/copy-button.direct.spec.ts`: the same five tests with `createDirective`,
  `inputBinding` and `outputBinding`.
- `src/app/limits.spec.ts`, one test each:
  - bindings are applied at the first change detection, not at creation (a required
    input throws NG0950 until then);
  - the element is a bare `<button>` straight under `document.body`, with no `appCopy`
    attribute and no children;
  - an attribute-only selector needs the `tagName` option ("Cannot determine tag name");
  - a misspelt input name fails at run time with NG0315 (in a host template the same
    typo is a build error, NG8002; not part of `npm run check` because it would break
    the build on purpose);
  - `inputBinding` doesn't check the value's type: a string reaches a number input;
  - a structural directive (`inject(TemplateRef)`) throws NG0201;
  - without a template around it, the optional `CopyGroup` injection is `null`;
  - a fake group can be given through `TestBed.overrideProvider`;
  - the real group behaviour needs a host component with two buttons in one group.

Line counts, from `node scripts/count-lines.mjs` (a code line is not blank and not a
`//` comment):

```
ok   src/app/copy-button.host.spec.ts: 72 code lines (expected 72), 5 tests
ok   src/app/copy-button.direct.spec.ts: 73 code lines (expected 73), 5 tests
```

## How to run

```
npm install
npm run check
```

`npm test` runs the Vitest suite on its own; `npm start` serves a two-button page.

## Versions it was run with

- Angular 22.2.3 (`@angular/core`, `@angular/compiler`, ...), Angular CLI and `@angular/build` 22.2.4
- Vitest 5.0.5 on jsdom 30.1.3, through the CLI's default `@angular/build:unit-test` builder
- TypeScript 6.0.3, Node 26.1.0, Windows 11

## What the post leaves out

- `createDirective` still makes a host component internally: `DirectiveTestHost` in
  `@angular/core/fesm2022/testing.mjs`, with an empty template. Your directive is attached
  to its root element.
- A selector with two different tag names (`button[x], a[x]`) throws unless you pass
  `tagName`.
- `DirectiveFixture` has `directiveInstance` and `onDestroy()` on top of the shared
  fixture members (`nativeElement`, `debugElement`, `detectChanges`, `whenStable`,
  `destroy`, ...). It has no `componentInstance` and no `setInput`; inputs only go in
  through `bindings`. Pass a signal to `inputBinding` to change an input later.
- Fake timers: switch them on only after the first `whenStable()`. With fake timers
  already on, `whenStable()` in the host-component version hung until the 5 s test
  timeout. After advancing past `resetAfter`, the state signal was idle but the DOM
  still said copied until `fixture.detectChanges()`; this happened in both styles, so
  it's not specific to `createDirective`. I didn't dig into why.
- Projected content: the element is empty, so a directive that reads its own text or
  children has nothing to read unless you append nodes yourself after creation.
- Status: `TestDirectiveOptions` is tagged `@publicApi 22.2` in the `.d.ts`, and the
  angular.dev API pages for `DirectiveFixture` and `TestDirectiveOptions` say stable.
  Added in [angular/angular#70453](https://github.com/angular/angular/pull/70453),
  closing [#54164](https://github.com/angular/angular/issues/54164); listed in the
  22.2.0 changelog as "add utility for testing directives".

## License

MIT
