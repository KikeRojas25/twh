import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-b2b',
  templateUrl: './b2b.component.html',
  styleUrls: ['./b2b.component.css'],
    standalone: true,
    imports: [
      RouterOutlet
    ]
})
export class B2bComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
