import { Component, Input } from "@angular/core";
import { VideoTableComponent } from "./video-table/video-table";

@Component({
    selector: 'app-video-interface',
    templateUrl: './video-interface.html',
    imports: [VideoTableComponent]
})
export class VideoInterfaceComponent {
    rows: any[] = [
      { id: 1, date: '2025-11-22', time: '10:00', cam: 'A7' },
      { id: 2, date: '2025-11-22', time: '09:55', cam: 'A6' },
      { id: 3, date: '2025-11-21', time: '07:52', cam: 'A2' },
      { id: 4, date: '2025-11-20', time: '12:34', cam: 'B1' },
      { id: 5, date: '2025-11-19', time: '08:15', cam: 'C3' }
    ];
}

/* Placeholder data */