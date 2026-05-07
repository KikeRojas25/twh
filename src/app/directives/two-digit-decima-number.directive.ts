import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Permite solo números con hasta 2 decimales.
 * Uso: <input type="number" appTwoDigitDecimaNumber />
 */
@Directive({
  selector: '[appTwoDigitDecimaNumber]',
  standalone: true,
})
export class TwoDigitDecimaNumberDirective {
  private regex = /^\d*\.?\d{0,2}$/;
  private allowedKeys = [
    'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight',
    'Delete', 'Enter',
  ];

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.allowedKeys.includes(event.key)) return;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;

    const current: string = this.el.nativeElement.value;
    const next = current.concat(event.key);
    if (next && !this.regex.test(next)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!this.regex.test(text)) {
      event.preventDefault();
    }
  }
}
