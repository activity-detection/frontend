import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { VideoData, VideoService } from "../../../services/video.service";

@Component({
    selector: 'app-video-interface',
	templateUrl: './video-interface.html',
	imports: [MatPaginatorModule, MatTableModule],
	styleUrls: ['./video-interface.css'],
})
export class VideoInterfaceComponent implements AfterViewInit {
	displayedColumns: string[] = ['id', 'desc', 'date', 'time', 'action'];

    dataSource = new MatTableDataSource<VideoData>([]);

	constructor(private videoService: VideoService) {
        this.videoService.videos$.subscribe(videos => {
            this.dataSource.data = videos;
        });
    }


    @ViewChild(MatPaginator) paginator!: MatPaginator;

    ngAfterViewInit() {
		this.dataSource.paginator = this.paginator;
    }
    
	onRowAction(item: VideoData) {
		console.log('Row action clicked:', item);
	}

	onView(item: VideoData) {
		window.location.href = `http://localhost:4200/video/${item.uuid}`;
	}

	onDelete(item: VideoData) {
		console.log('Delete clicked:', item);
		// TODO: implement delete confirmation and removal
	}
}