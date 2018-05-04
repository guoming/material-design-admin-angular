import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class FuseMatchMediaService
{
    activeMediaQuery: string;
    onMediaChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

    constructor(private observableMedia: ObservableMedia)
    {
        this.activeMediaQuery = '';

        this.observableMedia.subscribe((change: MediaChange) => {
            if ( this.activeMediaQuery !== change.mqAlias )
            {
                this.activeMediaQuery = change.mqAlias;
                this.onMediaChange.next(change.mqAlias);
            }
        });
    }
}
