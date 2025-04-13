import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-vehiculos',
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
  ]
})
export class VehiculosComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
