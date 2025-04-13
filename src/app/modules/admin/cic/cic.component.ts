import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-cic',
  templateUrl: './cic.component.html',
  styleUrls: ['./cic.component.css'],
  standalone: true,
  imports:[
    RouterOutlet
  ]
})
export class CicComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
