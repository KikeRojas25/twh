import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css'],
  standalone: true,
  imports: [
    RouterOutlet
  ]
})
export class FacturacionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
