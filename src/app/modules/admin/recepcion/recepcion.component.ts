import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-recepcion',
  templateUrl: './recepcion.component.html',
  styleUrls: ['./recepcion.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
  ]
})
export class RecepcionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
