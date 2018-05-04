import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector     : 'fuse-navigation',
    templateUrl  : './navigation.component.html',
    styleUrls    : ['./navigation.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FuseNavigationComponent
{
    @Input() layout = 'vertical';
    @Input() navigation: any;

    constructor()
    {

    }
}
