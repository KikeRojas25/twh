import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'chat-ia-button',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatRippleModule, MatTooltipModule],
    templateUrl: './chat-ia-button.component.html',
    styleUrls: ['./chat-ia-button.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ChatIaButtonComponent {
    @Output() openChat = new EventEmitter<void>();

    onClick(): void {
        this.openChat.emit();
    }
}
