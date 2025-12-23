import { Component } from '@angular/core';
import { VideoInterfaceComponent } from "./components/video-interface/video-interface";

@Component({
  selector: 'app-default-page',
  imports: [VideoInterfaceComponent],
  templateUrl: './default-page.html',
  styleUrl: './default-page.css',
})
export class DefaultPage {

}
