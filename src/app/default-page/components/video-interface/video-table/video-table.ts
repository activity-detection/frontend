import { Component, EventEmitter, HostListener, Input, Output, SimpleChanges } from "@angular/core";
import { TableRowComponent } from "./table-row/table-row";

@Component({
    selector: 'table[app-video-table]',
    templateUrl: './video-table.html',
    imports: [TableRowComponent]
})
export class VideoTableComponent {
    @Input() data: any[] = [];
    @Output() totalPagesChange = new EventEmitter<number>();

    pageSizeOptions = [1, 5, 8, 10, 15];
    pageSize = 15;
    currentPage = 1;

    paginatedItems: any[] = [];

    ngOnInit(): void {
        // użyj szerokości okna do dopasowania pageSize
        this.adjustPageSize(window.innerHeight);
        this.updatePagination();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] || changes['pageSize'] || changes['currentPage']) {
            this.updatePagination();
        }
    }

    private updatePagination() {
        const total = this.data?.length ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / Math.max(1, this.pageSize)));

        // clamp currentPage
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const start = (this.currentPage - 1) * Math.max(1, this.pageSize);
        this.paginatedItems = this.data?.slice(start, start + this.pageSize) ?? [];

        // emity do rodzica
        //this.paginated.emit(this.paginatedItems);
        //this.pageChange.emit(this.currentPage);
        //this.pageSizeChange.emit(this.pageSize);
        this.totalPagesChange.emit(totalPages);
    }

    @HostListener('window:resize')
    onResize() {
        const prev = this.pageSize;
        this.adjustPageSize(window.innerHeight);
        if (prev !== this.pageSize) {
            this.currentPage = 1;
        }
        this.updatePagination();
    }

    private adjustPageSize(height: number) {
        const thresholds = [500, 650, 800, 1080];
        const options = this.pageSizeOptions;

        const idx = thresholds.findIndex(threshold => height < threshold);

        this.pageSize = idx === -1 ? options[options.length - 1] : options[idx];
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil((this.data?.length ?? 0) / this.pageSize));
    }

    trackById(_: number, item: any) { return item?.id ?? _; }
}
