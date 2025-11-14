import {Component, OnInit} from '@angular/core';
import {VideoPlayerComponent} from './video-player/video-player';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-video-page',
  imports: [
    VideoPlayerComponent
  ],
  templateUrl: './video-page.html',
  styleUrl: './video-page.css',
})
export class VideoPage{
}
