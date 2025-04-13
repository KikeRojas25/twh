import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mantenimientos',
  templateUrl: './mantenimientos.component.html',
  styleUrls: ['./mantenimientos.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
   ]
})
export class MantenimientosComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
