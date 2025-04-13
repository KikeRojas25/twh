import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-despachos',
  templateUrl: './despachos.component.html',
  styleUrls: ['./despachos.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
  ]
  
})
export class DespachosComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
