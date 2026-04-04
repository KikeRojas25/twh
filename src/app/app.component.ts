import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
    private _checkSub?: Subscription;

    constructor(private _authService: AuthService) {}

    ngOnInit(): void {
        this._checkSub = interval(5 * 60 * 1000).subscribe(() => {
            if (this._authService.accessToken) {
                this._authService.checkStatus().subscribe();
            }
        });
    }

    ngOnDestroy(): void {
        this._checkSub?.unsubscribe();
    }
}
