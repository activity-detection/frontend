import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, map } from "rxjs";

interface RawVideo {
    id: string;
    name: string;
    description: string;
    upload_date: string;
}

export interface VideoData {
    id: number;
    description: string;
    uploadDate: string;
    uploadTime: string;
    uuid: string;
}

@Injectable({providedIn: 'root'})
export class VideoService {
    private apiUrl = 'http://localhost:8080/videos';
    private videosSubject = new BehaviorSubject<VideoData[]>([]);
    videos$ = this.videosSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadVideos();
    }

    loadVideos() {
        this.http.get<RawVideo[]>(this.apiUrl).pipe(
            map(videos => videos.map((rawVideo, index): VideoData => {
                const dateTime = rawVideo.upload_date.split('T');
                const uploadDate = dateTime[0];                    
                const uploadTime = dateTime[1]?.split('.')[0] || '';

                return {
                    id: index + 1,
                    description: rawVideo.description,
                    uploadDate,
                    uploadTime,
                    uuid: rawVideo.id
                };
            }))
        ).subscribe(videos => {
            this.videosSubject.next(videos);
        });
    } 
}