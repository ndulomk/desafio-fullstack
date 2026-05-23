import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmModalComponent } from '../../components/confirm-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
