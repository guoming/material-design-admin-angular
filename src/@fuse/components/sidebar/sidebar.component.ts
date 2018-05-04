import { Component, ElementRef, HostBinding, HostListener, Input, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { animate, AnimationBuilder, AnimationPlayer, style } from '@angular/animations';
import { ObservableMedia } from '@angular/flex-layout';
import { Subscription } from 'rxjs/Subscription';

import { FuseSidebarService } from './sidebar.service';
import { FuseMatchMediaService } from '@fuse/services/match-media.service';
import { FuseConfigService } from '@fuse/services/config.service';

@Component({
    selector     : 'fuse-sidebar',
    templateUrl  : './sidebar.component.html',
    styleUrls    : ['./sidebar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FuseSidebarComponent implements OnInit, OnDestroy
{
    // Name
    @Input()
    name: string;

    // Align
    @Input()
    align: 'left' | 'right';

    // Open
    @HostBinding('class.open')
    opened: boolean;

    // Locked Open
    @Input()
    lockedOpen: string;

    // isLockedOpen
    @HostBinding('class.locked-open')
    isLockedOpen: boolean;

    // Folded
    @HostBinding('class.folded')
    @Input()
    set folded(value: boolean)
    {
        // Only work if the sidebar is not closed
        if ( !this.opened )
        {
            return;
        }

        // Set the folded
        this._folded = value;

        // Programmatically add/remove margin to the element
        // that comes after or before based on the alignment
        let sibling,
            styleRule;

        const styleValue = '64px';

        // Get the sibling and set the style rule
        if ( this.align === 'left' )
        {
            sibling = this.elementRef.nativeElement.nextElementSibling;
            styleRule = 'marginLeft';
        }
        else
        {
            sibling = this.elementRef.nativeElement.previousElementSibling;
            styleRule = 'marginRight';
        }

        // If there is no sibling, return...
        if ( !sibling )
        {
            return;
        }

        // If folded...
        if ( value )
        {
            // Set the style
            this.renderer.setStyle(sibling, styleRule, styleValue);
        }
        // If unfolded...
        else
        {
            // Remove the style
            this.renderer.removeStyle(sibling, styleRule);
        }
    }

    get folded(): boolean
    {
        return this._folded;
    }

    // Folded unfolded
    @HostBinding('class.unfolded')
    unfolded: boolean;

    // Private
    private _folded: boolean;
    private _wasActive: boolean;
    private _backdrop: HTMLElement | null = null;
    private _player: AnimationPlayer;
    private _onMediaChangeSubscription: Subscription;

    /**
     * Constructor
     *
     * @param {Renderer2} renderer
     * @param {ElementRef} elementRef
     * @param {AnimationBuilder} animationBuilder
     * @param {ObservableMedia} observableMedia
     * @param {FuseConfigService} fuseConfigService
     * @param {FuseSidebarService} fuseSidebarService
     * @param {FuseMatchMediaService} fuseMatchMediaService
     */
    constructor(
        private renderer: Renderer2,
        private elementRef: ElementRef,
        private animationBuilder: AnimationBuilder,
        private observableMedia: ObservableMedia,
        private fuseConfigService: FuseConfigService,
        private fuseSidebarService: FuseSidebarService,
        private fuseMatchMediaService: FuseMatchMediaService
    )
    {
        // Set the defaults
        this.opened = false;
        this.folded = false;
        this.align = 'left';
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Register the sidebar
        this.fuseSidebarService.register(this.name, this);

        // Setup alignment
        this._setupAlignment();

        // Setup lockedOpen
        this._setupLockedOpen();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // If the sidebar is folded, unfold it to revert modifications
        if ( this.folded )
        {
            this.unfold();
        }

        // Unregister the sidebar
        this.fuseSidebarService.unregister(this.name);

        // Unsubscribe from the media watcher subscription
        this._onMediaChangeSubscription.unsubscribe();
    }

    /**
     * Set the sidebar alignment
     *
     * @private
     */
    private _setupAlignment(): void
    {
        // Add the correct class name to the sidebar
        // element depending on the align attribute
        if ( this.align === 'right' )
        {
            this.renderer.addClass(this.elementRef.nativeElement, 'right-aligned');
        }
        else
        {
            this.renderer.addClass(this.elementRef.nativeElement, 'left-aligned');
        }
    }

    /**
     * Setup the lockedOpen handler
     *
     * @private
     */
    private _setupLockedOpen(): void
    {
        // Return if the lockedOpen wasn't set
        if ( !this.lockedOpen )
        {
            return;
        }

        // Set the wasActive for the first time
        this._wasActive = false;

        // Act on every media change
        this._onMediaChangeSubscription =

            this.fuseMatchMediaService.onMediaChange.subscribe(() => {

                // Get the active status
                const isActive = this.observableMedia.isActive(this.lockedOpen);

                // If the both status are the same, don't act
                if ( this._wasActive === isActive )
                {
                    return;
                }

                // Activate the lockedOpen
                if ( isActive )
                {
                    // Set the lockedOpen status
                    this.isLockedOpen = true;

                    // Force the the opened status to true
                    this.opened = true;

                    // Read the folded setting from the config
                    // and fold the sidebar if it's true
                    if ( this.fuseConfigService.config.layout.navigationFolded )
                    {
                        this.fold();
                    }

                    // Hide the backdrop if any exists
                    this.hideBackdrop();
                }
                // De-Activate the lockedOpen
                else
                {
                    // Set the lockedOpen status
                    this.isLockedOpen = false;

                    // Unfold the sidebar in case if it was folded
                    this.unfold();

                    // Force the the opened status to close
                    this.opened = false;
                }

                // Store the new active status
                this._wasActive = isActive;
            });
    }

    /**
     * Open the sidebar
     */
    open(): void
    {
        if ( this.opened || this.isLockedOpen )
        {
            return;
        }

        // Show the backdrop
        this.showBackdrop();

        // Set the opened status
        this.opened = true;
    }

    /**
     * Close the sidebar
     */
    close(): void
    {
        if ( !this.opened || this.isLockedOpen )
        {
            return;
        }

        // Hide the backdrop
        this.hideBackdrop();

        // Set the opened status
        this.opened = false;
    }

    /**
     * Toggle open/close the sidebar
     */
    toggleOpen(): void
    {
        if ( this.opened )
        {
            this.close();
        }
        else
        {
            this.open();
        }
    }

    /**
     * Mouseenter
     */
    @HostListener('mouseenter')
    onMouseEnter(): void
    {
        // Only work if the sidebar is folded
        if ( !this.folded )
        {
            return;
        }

        // Unfold the sidebar temporarily
        this.unfolded = true;
    }

    /**
     * Mouseleave
     */
    @HostListener('mouseleave')
    onMouseLeave(): void
    {
        // Only work if the sidebar is folded
        if ( !this.folded )
        {
            return;
        }

        // Fold the sidebar back
        this.unfolded = false;
    }

    /**
     * Fold the sidebar permanently
     */
    fold(): void
    {
        // Only work if the sidebar is not folded
        if ( this.folded )
        {
            return;
        }

        // Fold
        this.folded = true;
    }

    /**
     * Unfold the sidebar permanently
     */
    unfold(): void
    {
        // Only work if the sidebar is folded
        if ( !this.folded )
        {
            return;
        }

        // Unfold
        this.folded = false;
    }

    /**
     * Toggle the sidebar fold/unfold permanently
     */
    toggleFold(): void
    {
        if ( this.folded )
        {
            this.unfold();
        }
        else
        {
            this.fold();
        }
    }

    /**
     * Show the backdrop
     */
    showBackdrop(): void
    {
        // Create the backdrop element
        this._backdrop = this.renderer.createElement('div');

        // Add a class to the backdrop element
        this._backdrop.classList.add('fuse-sidebar-overlay');

        // Append the backdrop to the parent of the sidebar
        this.renderer.appendChild(this.elementRef.nativeElement.parentElement, this._backdrop);

        // Create the enter animation and attach it to the player
        this._player =
            this.animationBuilder
                .build([
                    animate('300ms ease', style({opacity: 1}))
                ]).create(this._backdrop);

        // Play the animation
        this._player.play();

        // Add an event listener to the overlay
        this._backdrop.addEventListener('click', () => {
                this.close();
            }
        );
    }

    /**
     * Hide the backdrop
     */
    hideBackdrop(): void
    {
        if ( !this._backdrop )
        {
            return;
        }

        // Create the leave animation and attach it to the player
        this._player =
            this.animationBuilder
                .build([
                    animate('300ms ease', style({opacity: 0}))
                ]).create(this._backdrop);

        // Play the animation
        this._player.play();

        // Once the animation is done...
        this._player.onDone(() => {

            // If the backdrop still exists...
            if ( this._backdrop )
            {
                // Remove the backdrop
                this._backdrop.parentNode.removeChild(this._backdrop);
                this._backdrop = null;
            }
        });
    }
}
