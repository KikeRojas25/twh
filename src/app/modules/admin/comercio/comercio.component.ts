import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppComponent } from "../../../app.component";

@Component({
  selector: 'app-comercio',
  templateUrl: './comercio.component.html',
  styleUrls: ['./comercio.component.css'],
  standalone: true,
  imports: [RouterOutlet, AppComponent]
})
export class ComercioComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
