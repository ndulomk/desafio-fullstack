import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './modules/app/app.config';
import { App } from './modules/app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
