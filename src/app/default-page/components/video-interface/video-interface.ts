import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';

@Component({
    selector: 'app-video-interface',
	templateUrl: './video-interface.html',
	imports: [MatPaginatorModule, MatTableModule],
	styleUrls: ['./video-interface.css'],
})
export class VideoInterfaceComponent implements AfterViewInit {
	displayedColumns: string[] = ['id', 'date', 'time', 'action'];
    dataSource = new MatTableDataSource<VideoData>(PLACEHOLDER_DATA);

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    ngAfterViewInit() {
		this.dataSource.paginator = this.paginator;
    }
    
	onRowAction(item: VideoData) {
		console.log('Row action clicked:', item);
	}

	onView(item: VideoData) {
		console.log('View clicked:', item);
		// TODO: implement navigation or modal show
	}

	onDelete(item: VideoData) {
		console.log('Delete clicked:', item);
		// TODO: implement delete confirmation and removal
	}
    /*totalPages: number = 1;*/
}
/*
    onTotalPagesChange(tp: number | Event) {
    // szybkie logowanie, zobaczysz strukturę eventu w konsoli przeglądarki
      console.log('totalPagesChange event:', tp);
    }
      */

/* Placeholder data */

export interface VideoData {
		id: number;
		date: string;
		time: string;
	}

const PLACEHOLDER_DATA: VideoData[] = [
	{ id: 1, date: '2025-11-22', time: '10:00:01'},
	{ id: 2, date: '2025-11-22', time: '09:55:21'},
	{ id: 3, date: '2025-11-21', time: '07:52:31'},
	{ id: 4, date: '2025-11-20', time: '12:34:22'},
	{ id: 5, date: '2025-11-19', time: '08:15:44'},
	{ id: 6, date: '2025-11-22', time: '10:00:12'},
	{ id: 7, date: '2025-11-22', time: '09:55:13'},
	{ id: 8, date: '2025-11-21', time: '07:52:00'},
	{ id: 9, date: '2025-11-20', time: '12:34:01'},
	{ id: 10, date: '2025-11-19', time: '08:15:44'}
];