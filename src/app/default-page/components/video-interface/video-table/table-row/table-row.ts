import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
    selector: 'tr[table-row]',
    templateUrl: './table-row.html'
})
export class TableRowComponent {
    @Input() item: any;
    @Output() view = new EventEmitter<any>();
    @Output() remove = new EventEmitter<any>();

    onView() { this.view.emit(this.item); }
    onDelete() { this.remove.emit(this.item); }
}