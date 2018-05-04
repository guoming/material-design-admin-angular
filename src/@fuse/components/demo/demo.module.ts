import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatDividerModule, MatListModule } from '@angular/material';

import { FuseDemoContentComponent } from './demo-content/demo-content.component';
import { FuseDemoSidenavComponent } from './demo-sidenav/demo-sidenav.component';

@NgModule({
    declarations: [
        FuseDemoContentComponent,
        FuseDemoSidenavComponent
    ],
    imports     : [
        RouterModule,

        MatDividerModule,
        MatListModule
    ],
    exports     : [
        FuseDemoContentComponent,
        FuseDemoSidenavComponent
    ]
})
export class FuseDemoModule
{
}
