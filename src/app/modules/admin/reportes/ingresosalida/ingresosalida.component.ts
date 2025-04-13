import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-ingresosalida',
  templateUrl: './ingresosalida.component.html',
  styleUrls: ['./ingresosalida.component.css'],
    standalone: true,
    imports: [
      FormsModule,
      CommonModule,
      MatIcon,
      ButtonModule
    ]
})
export class IngresosalidaComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  exportar() {
    let url = 'http://104.36.166.65/reptwh/RepIngresoSalidas.aspx';
  window.open(url);
}

}
