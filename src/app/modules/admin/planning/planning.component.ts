import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css'],
  standalone: true,
  imports: [ RouterOutlet]
})
export class PlanningComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
