import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-inventariopaletas',
  templateUrl: './inventariopaletas.component.html',
  styleUrls: ['./inventariopaletas.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIcon,
    ButtonModule
  ]
})
export class InventariopaletasComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  
  exportar() {
       let url = 'http://104.36.166.65/reptwh/repPaletas.aspx';
     window.open(url);
  }

}
