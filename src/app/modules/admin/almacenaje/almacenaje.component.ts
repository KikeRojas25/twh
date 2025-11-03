import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-almacenaje',
  templateUrl: './almacenaje.component.html',
  styleUrls: ['./almacenaje.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
] 
})
export class AlmacenajeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
