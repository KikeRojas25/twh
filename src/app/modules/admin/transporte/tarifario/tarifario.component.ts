import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-tarifario',
  templateUrl: './tarifario.component.html',
  styleUrls: ['./tarifario.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
  ]
})
export class TarifarioComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
