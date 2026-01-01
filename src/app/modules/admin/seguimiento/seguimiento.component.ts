import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.css'],
  standalone: true,
  imports : [
    RouterOutlet
  ]
})
export class SeguimientoComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

