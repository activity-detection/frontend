import { Component, Input } from "@angular/core";
import { TableRowComponent } from "./table-row/table-row";

@Component({
    selector: 'table[app-video-table]',
    templateUrl: './video-table.html',
    imports: [TableRowComponent]
})
export class VideoTableComponent {
    @Input() items: any[] = [];

}

/* Later, number of rows and their data will be passed from parent component */