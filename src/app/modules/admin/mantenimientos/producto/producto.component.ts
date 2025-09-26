import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.scss'
})
export class ProductoComponent implements OnInit{
  constructor() { }

  ngOnInit() {
  }

}
