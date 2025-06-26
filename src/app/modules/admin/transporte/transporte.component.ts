import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-transporte',
  templateUrl: './transporte.component.html',
  styleUrls: ['./transporte.component.css'],
  standalone: true,
  imports : [
    RouterOutlet
  ]
})
export class TransporteComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
