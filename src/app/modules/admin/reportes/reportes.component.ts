import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  standalone: true,
  imports : [RouterOutlet]
})
export class ReportesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
