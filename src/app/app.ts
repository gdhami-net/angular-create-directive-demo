import { Component } from '@angular/core';
import { CopyButton } from './copy-button';
import { CopyGroup } from './copy-group';

@Component({
  imports: [CopyButton, CopyGroup],
  selector: 'app-root',
  template: `
    <h1>Copy buttons</h1>
    <div appCopyGroup>
      <p><code>npm install</code> <button appCopy="npm install">Copy</button></p>
      <p><code>npm run check</code> <button appCopy="npm run check">Copy</button></p>
    </div>`,
  styles: `button.copied { outline: 2px solid green; }`,
})
export class App {}
