import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-configuracion',
    templateUrl: './configuracion.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
    configForm: UntypedFormGroup;
    passwordForm: UntypedFormGroup;
    user: User;
    showPasswordFields: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _userService: UserService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;
                this._createForms();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create forms
     */
    private _createForms(): void {
        // Create the profile form
        this.configForm = this._formBuilder.group({
            name: [this.user?.name || '', [Validators.required]],
            dni: [this.user?.dni || '', [Validators.required]],
            phone: [this.user?.phone || '', [Validators.required]],
        });

        // Create the password form
        this.passwordForm = this._formBuilder.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        }, { validators: this._passwordMatchValidator });
    }

    /**
     * Password match validator
     */
    private _passwordMatchValidator(group: UntypedFormGroup): any {
        const newPassword = group.get('newPassword');
        const confirmPassword = group.get('confirmPassword');

        if (!newPassword || !confirmPassword) {
            return null;
        }

        return newPassword.value === confirmPassword.value
            ? null
            : { passwordMismatch: true };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Save profile
     */
    saveProfile(): void {
        // Return if the form is invalid
        if (this.configForm.invalid) {
            return;
        }

        // Disable the form
        this.configForm.disable();

        // Update user
        const updatedUser = {
            ...this.user,
            name: this.configForm.get('name').value,
            dni: this.configForm.get('dni').value,
            phone: this.configForm.get('phone').value,
        };

        this._userService.update(updatedUser).subscribe({
            next: () => {
                // Re-enable the form
                this.configForm.enable();
                // Show success message or handle as needed
            },
            error: () => {
                // Re-enable the form
                this.configForm.enable();
            },
        });
    }

    /**
     * Change password
     */
    changePassword(): void {
        // Return if the form is invalid
        if (this.passwordForm.invalid) {
            return;
        }

        // Disable the form
        this.passwordForm.disable();

        const currentPassword = this.passwordForm.get('currentPassword').value;
        const newPassword = this.passwordForm.get('newPassword').value;

        // TODO: Implement password change service call
        // For now, just re-enable the form
        setTimeout(() => {
            this.passwordForm.enable();
            this.passwordForm.reset();
            this.showPasswordFields = false;
        }, 1000);
    }

    /**
     * Toggle password fields
     */
    togglePasswordFields(): void {
        this.showPasswordFields = !this.showPasswordFields;
        if (!this.showPasswordFields) {
            this.passwordForm.reset();
        }
    }
}
