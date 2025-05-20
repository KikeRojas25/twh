import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent implements OnInit{

  constructor() { }

  ngOnInit() {
  }

}
