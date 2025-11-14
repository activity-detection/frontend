import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.html',
  styleUrls: ['./video-player.css']
})
export class VideoPlayerComponent implements OnInit {
  apiUrl: string = 'http://localhost:8080/videos/';

  videoUrl!: string;

  constructor(private readonly route: ActivatedRoute) {
  }

  ngOnInit(): void{
    this.route.paramMap.subscribe(paramMap => {
      const videoId = paramMap.get("videoId");
      if(videoId) this.videoUrl = this.apiUrl+videoId;
    })
  }
}
