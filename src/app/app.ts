import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeederService } from './services/seeder.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('krishiva');

  constructor(private seeder: SeederService) {}

  ngOnInit() {
    this.seeder.seedData();
  }
}
