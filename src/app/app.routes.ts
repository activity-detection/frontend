import { Routes } from '@angular/router';
import {DefaultPage} from './default-page/default-page';
import {VideoPage} from './video-page/video-page';

export const routes: Routes = [
  {path: '', component: DefaultPage},
  {path: 'video/:videoId', component: VideoPage},
  {path: '**', redirectTo: ''}
];
