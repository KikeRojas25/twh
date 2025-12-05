import { Component, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SafePipe } from 'app/core/pipes/safe.pipe';

@Component({
    selector: 'app-dashboard-pbi',
    templateUrl: './dashboard-pbi.component.html',
    styleUrls: ['./dashboard-pbi.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatIconModule, SafePipe],
})
export class DashboardPbiComponent {
    // Power BI iframe URL
    powerBiUrl = 'https://app.powerbi.com/view?r=eyJrIjoiMDU3M2IxY2ItODkxMy00YzE4LTk1MzUtNTk4ZjcwM2IzNzE4IiwidCI6IjlhZGI4ODNkLTg3OTQtNDU3Mi1iMTU2LWFiOTUyZjA2MDY5MCIsImMiOjR9';
}
