import { Component, Input } from "@angular/core";
import { VideoTableComponent } from "./video-table/video-table";

@Component({
    selector: 'app-video-interface',
    templateUrl: './video-interface.html',
    imports: [VideoTableComponent]
})
export class VideoInterfaceComponent {
    totalPages: number = 1;
    data: any[] = [
      { id: 1, date: '2025-11-22', time: '10:00:01', cam: 'A7' },
      { id: 2, date: '2025-11-22', time: '09:55:21', cam: 'A6' },
      { id: 3, date: '2025-11-21', time: '07:52:31', cam: 'A2' },
      { id: 4, date: '2025-11-20', time: '12:34:22', cam: 'B1' },
      { id: 5, date: '2025-11-19', time: '08:15:44', cam: 'C3' },
      { id: 6, date: '2025-11-22', time: '10:00:12', cam: 'A7' },
      { id: 7, date: '2025-11-22', time: '09:55:13', cam: 'A6' },
      { id: 8, date: '2025-11-21', time: '07:52:00', cam: 'A2' },
      { id: 9, date: '2025-11-20', time: '12:34:01', cam: 'B1' },
      { id: 10, date: '2025-11-19', time: '08:15:44', cam: 'C3' }
    ];

    onTotalPagesChange(tp: number) { this.totalPages = tp; }
}

/* Placeholder data */