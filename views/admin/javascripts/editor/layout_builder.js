/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4; */

/*
 * Dynamic layout builder application in the add view.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by
 * applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 *
 * @package     omeka
 * @subpackage  neatline
 * @author      Scholars' Lab <>
 * @author      Bethany Nowviskie <bethany@virginia.edu>
 * @author      Adam Soroka <ajs6f@virginia.edu>
 * @author      David McClure <david.mcclure@virginia.edu>
 * @copyright   2011 The Board and Visitors of the University of Virginia
 * @license     http://www.apache.org/licenses/LICENSE-2.0.html Apache 2 License
 */

(function($, undefined) {


    $.widget('neatline.layoutbuilder', {

        options: {

            // CSS constants.
            css: {
                top_block_percentage: 60,
                undated_items_width: 150,
                vertical_offset_tier1: 75,
                vertical_offset_tier2: 150,
                gloss_fade_duration: 300,
            },

            // Hex defaults.
            colors: {
                map: {
                    default: '#f9f9f9',
                    target: '#fffcf4'
                },
                timeline: {
                    default: '#f4f4f4',
                    target: '#fffcf4'
                },
                items: {
                    default: '#f0f0f0',
                    target: '#fffcf4'
                }
            }

        },

        /*
         * Get markup, run start-up routine.
         */
        _create: function() {

            // Get window for mousemove binding.
            this._window = $(window);

            // Getters for options and dragbox divs.
            this.buttons = $('#options');
            this.dragbox = $('#drag-box');

            // Set tracker arrays that record the last parameter
            // loadouts that triggered a div slide.
            this._lastParams = null;

            // Build and prepare markup.
            this._disableSelect();
            this._createDraggers();

            // Instantiate the positioning manager.
            this.dragbox.positioner({
                markup: {
                    map: '#drag-map',
                    timeline: '#drag-timeline',
                    items: '#drag-items'
                }
            });

            // Start-up routine.
            this.getPxConstants();
            this._createButtons();
            this._setStartingParameters();
            this._addDragEvents();

        },

        /*
         * Pull the saved positioning constants out of the Nealtine global
         * and prepare the buttons.
         */
        _setStartingParameters: function() {

            // Get starting parameters out of the Neatline global.
            this._top_element =             Neatline.top_element;
            this._items_h_pos =             Neatline.items_h_pos;
            this._items_v_pos =             Neatline.items_v_pos;
            this._items_height =            Neatline.items_height;
            this._is_map =                  Boolean(Neatline.is_map);
            this._is_timeline =             Boolean(Neatline.is_timeline);
            this._is_items =                Boolean(Neatline.is_items);

            // Push starting params into positioner and do first position.
            this._computePositions();

            // Enable the buttons.
            this.map_toggle.togglebutton('enable');
            this.timeline_toggle.togglebutton('enable');
            this.items_toggle.togglebutton('enable');

            // For each block, if active then temporarily knock false
            // the tracker (so that the button press initializes the
            // block to active) and trigger the button press.
            if (this._is_map) {
                this._is_map = false;
                this.map_toggle.togglebutton('press');
            } else {
                this._is_map = false;
            }

            if (this._is_timeline) {
                this._is_timeline = false;
                this.timeline_toggle.togglebutton('press');
            } else {
                this._is_timeline = false;
            }

            if (this._is_items) {
                this._is_items = false;
                this.items_toggle.togglebutton('press');
            } else {
                this._is_items = false;
            }

        },

        /*
         * Re-measure the container div.
         */
        getPxConstants: function() {

            // Hit the measuring method on the positioner.
            this.dragbox.positioner('measure');

            // Capture the new constants.
            this.width =                this.dragbox.positioner('getAttr', 'width');
            this.height =               this.dragbox.positioner('getAttr', 'height');
            this.minorWidth =           this.dragbox.positioner('getAttr', 'minorWidth');
            this.majorWidth =           this.dragbox.positioner('getAttr', 'majorWidth');
            this.majorHeight =          this.dragbox.positioner('getAttr', 'majorHeight');
            this.minorHeight =          this.dragbox.positioner('getAttr', 'minorHeight');

            // Get the offset of the container relative to the window.
            this.dragboxOffset = this.dragbox.offset();

        },

        /*
         * Compute new positions from the current values of the trackers.
         */
        _computePositions: function() {

            this.positions = this.dragbox.positioner(
                'compute',
                this._is_map,
                this._is_timeline,
                this._is_items,
                this._top_element,
                this._items_v_pos,
                this._items_h_pos,
                this._items_height
            );

        },

        /*
         * Turn off text selection on the container.
         */
        _disableSelect: function() {

            // Turn off text selection on the whole container div.
            this.element.css('MozUserSelect', 'none');
            this.element.bind('selectstart mousedown', function() {
                return false;
            });

            // Fix the pointer style in the drag box.
            this.dragbox.css('cursor', 'default');

        },

        /*
         * Construct the toggle button widgets.
         */
        _createButtons: function() {

            var self = this;

            // Instantiate buttons, define callbacks.
            this.map_toggle =               $('#toggle-map');
            this.timeline_toggle =          $('#toggle-timeline');
            this.items_toggle =             $('#toggle-items');

            this.map_toggle.togglebutton({
                pressed_by_default: false,
                enabled_by_default: false,
                press: function() { self._toggleMap(); },
                unpress: function() { self._toggleMap(); },
            });

            this.timeline_toggle.togglebutton({
                pressed_by_default: false,
                enabled_by_default: false,
                press: function() { self._toggleTimeline(); },
                unpress: function() { self._toggleTimeline(); }
            });

            this.items_toggle.togglebutton({
                pressed_by_default: false,
                enabled_by_default: false,
                press: function() { self._toggleItems(); },
                unpress: function() { self._toggleItems(); }
            });

        },

        /*
         * Build the markup for the drag boxes.
         */
        _createDraggers: function() {

            // Create the boxes.
            this.map_drag =         this.__createMapDiv();
            this.timeline_drag =    this.__createTimelineDiv();
            this.items_drag =       this.__createItemsDiv();

            // Inject.
            this.dragbox.append(
                this.map_drag,
                this.timeline_drag,
                this.items_drag);

        },

        /*
         * Bind event listeners onto the drag boxes.
         */
        _addDragEvents: function() {

            var self = this;

            // Gloss map.
            this.map_drag.bind({

                'mouseenter': function() {
                    if (!self._is_dragging) {
                        self.__mapHighlight('enter');
                    }
                },

                'mouseleave': function() {
                    if (!self._is_dragging) {
                        self.__mapHighlight('leave');
                    }
                },

                'mousedown': function(e) {
                    if (!self._is_dragging) {
                        self._current_dragger = 'map';
                        self.__doMapDrag(e);
                    }
                }

            });

            // Gloss timeline.
            this.timeline_drag.bind({

                'mouseenter': function() {
                    if (!self._is_dragging) {
                        self.__timelineHighlight('enter');
                    }
                },

                'mouseleave': function() {
                    if (!self._is_dragging) {
                        self.__timelineHighlight('leave');
                    }
                },

                'mousedown': function(e) {
                    if (!self._is_dragging) {
                        self._current_dragger = 'timeline';
                        self.__doTimelineDrag(e);
                    }
                }

            });

            // Gloss items.
            this.items_drag.bind({

                'mouseenter': function() {
                    if (!self._is_dragging) {
                        self.__itemsHighlight('enter');
                    }
                },

                'mouseleave': function() {
                    if (!self._is_dragging) {
                        self.__itemsHighlight('leave');
                    }
                },

                'mousedown': function(e) {
                    if (!self._is_dragging) {
                        self._current_dragger = 'items';
                        self.__doItemsDrag(e);
                    }
                }

            });

        },

        /*
         * Re-render the block positioning.
         */
        _reposition: function() {

            // Manifest the parameters.
            this.dragbox.positioner('apply');

            // Center tags.
            this.centerAllTags();

        },

        /*
         * Center the label for an individual block.
         */
        _position_tag: function(draggable) {

            var tag = draggable.find('.drag-tag');
            var draggable_height = draggable.height();
            var tag_height = tag.height();

            tag.css('top', (draggable_height/2)-(tag_height/2) + 'px');

        },

        /*
         * Center the block labels.
         */
        centerAllTags: function() {

            this._position_tag(this.map_drag);
            this._position_tag(this.timeline_drag);
            this._position_tag(this.items_drag);

        },

        /*
         * Toggle the map block.
         */
        _toggleMap: function() {

            switch(this._is_map) {

                case true:

                    this._is_map = false;

                    // If no timeline, disable items.
                    if (!this._is_timeline) {
                        this.items_toggle.togglebutton('disable');
                        this._toggleItems();
                    }

                break;

                case false:

                    this._is_map = true;

                break;

            }

            // Recalculate all positions for all divs.
            this._computePositions();
            this._reposition();

        },

        /*
         * Toggle the timeline block.
         */
        _toggleTimeline: function() {

            switch(this._is_timeline) {

                case true:

                    this._is_timeline = false;

                    // If no timeline, disable items.
                    if (!this._is_map) {
                        this.items_toggle.togglebutton('disable');
                        this._toggleItems();
                    }

                break;

                case false:

                    this._is_timeline = true;

                break;

            }

            // Recalculate all positions for all divs.
            this._computePositions();
            this._reposition();

        },

        /*
         * Toggle the items block.
         */
        _toggleItems: function() {

            switch(this._is_items) {

                case true:

                    this._is_items = false;

                break;

                case false:

                    this._is_items = true;

                break;

            }

            // Recalculate all positions for all divs.
            this._computePositions();
            this._reposition();

        },

        /*
         * Slide a block tag to the center of the container.
         */
        _animate_position_tag: function(draggable, height) {

            var tag = draggable.find('.drag-tag');
            var tag_height = tag.height();

            tag.stop().animate({ 'top': (height/2)-(tag_height/2) + 'px' });

        },


        /*
         * =================
         * Glossing and dragging methods.
         * =================
         */


        /*
         * Highlight the map block.
         */
        __mapHighlight: function(enter_or_leave) {

            // Figure out which color to tween to.
            switch (enter_or_leave) {

                case 'enter':
                    var target = this.options.colors.map.target;
                break;

                case 'leave':
                    var target = this.options.colors.map.default;
                break;

            }

            this.map_drag.clearQueue().animate({
                'background-color': target
            }, this.options.css.gloss_fade_duration);

        },

        /*
         * Highlight the timeline block.
         */
        __timelineHighlight: function(enter_or_leave) {

            // Figure out which color to tween to.
            switch (enter_or_leave) {

                case 'enter':
                    var target = this.options.colors.timeline.target
                break;

                case 'leave':
                    var target = this.options.colors.timeline.default
                break;

            }

            this.timeline_drag.clearQueue().animate({
                'background-color': target
            }, this.options.css.gloss_fade_duration);

        },

        /*
         * Highlight the items block.
         */
        __itemsHighlight: function(enter_or_leave) {

            // Figure out which color to tween to.
            switch (enter_or_leave) {

                case 'enter':
                    var target = this.options.colors.items.target
                break;

                case 'leave':
                    var target = this.options.colors.items.default
                break;

            }

            this.items_drag.clearQueue().animate({
                'background-color': target
            }, this.options.css.gloss_fade_duration);

        },

        /*
         * Map drag handler.
         */
        __doMapDrag: function(trigger_event_object) {

            var self = this;

            // Set dragging tracker.
            this._is_dragging = true;

            // Get starting pointer coordinates.
            var startingX = trigger_event_object.pageX;
            var startingY = trigger_event_object.pageY;

            // Get starting div offsets.
            var startingOffsetX = this.positions.map.left;
            var startingOffsetY = this.positions.map.top;

            // Make the drag div see-through and always on top.
            this.__fadeDragger(this.map_drag);

            this._window.bind({

                'mousemove': function(e) {

                    // Calculate new offsets.
                    var offsetX = e.pageX - startingX;
                    var offsetY = e.pageY - startingY;

                    // Apply new position.
                    self.map_drag.css({
                        'left': startingOffsetX + offsetX,
                        'top': startingOffsetY + offsetY
                    });

                    /*
                     * Repositioning listeners.
                     */

                    // TIMELINE and ITEMS.
                    if (self._is_timeline && self._is_items) {

                        // Vertical switching between map and timeline.

                        // MAP on top:
                        if (self._top_element == 'map') {

                            // ** Cursor down.
                            if (e.pageY > (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'timeline';
                                self.__slideTimeline(false);
                                self.__slideItems(false);
                            }

                        }

                        // TIMELINE on top:
                        else if (self._top_element == 'timeline') {

                            // ** Cursor up.
                            if (e.pageY < (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'map';
                                self.__slideTimeline(false);
                                self.__slideItems(false);

                            }

                        }

                        // Horizontal switching between map and items.

                        if (self.__mapIsLevelWithItems()) {

                            // ITEMS on right:
                            if (self._items_h_pos == 'right') {

                                // ** Cursor right.
                                if (e.pageX > (self.dragoxOffset.left + self.majorWidth)) {
                                    self._items_h_pos = 'left';
                                    self.__slideItems(false);
                                }

                            }

                            // ITEMS on left:
                            else if (self._items_h_pos == 'left') {

                                // ** Cursor left.
                                if (e.pageX < (self.dragoxOffset.left + self.minorWidth)) {
                                    self._items_h_pos = 'right';
                                    self.__slideItems(false);
                                }

                            }

                        }

                    }

                    // TIMELINE:
                    else if (self._is_timeline && !self._is_items) {

                        // Vertical switching between map and timeline.

                        // MAP on top:
                        if (self._top_element == 'map') {

                            // ** Cursor down.
                            if (e.pageY > (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'timeline';
                                self.__slideTimeline(false);
                            }

                        }

                        // TIMELINE on top:
                        else if (self._top_element == 'timeline') {

                            // ** Cursor up.
                            if (e.pageY < (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'map';
                                self.__slideTimeline(false);
                            }

                        }

                    }

                },

                'mouseup': function() {

                    self.__slideMap(true);
                    self._window.unbind('mousemove mouseup');

                }

            });

        },

        /*
         * Timeline drag handler.
         */
        __doTimelineDrag: function(trigger_event_object) {

            var self = this;

            // Set dragging tracker.
            this._is_dragging = true;

            // Get starting pointer coordinates.
            var startingX = trigger_event_object.pageX;
            var startingY = trigger_event_object.pageY;

            // Get starting div offsets.
            var startingOffsetX = this.positions.timeline.left;
            var startingOffsetY = this.positions.timeline.top;

            // Make the drag div see-through and always on top.
            this.__fadeDragger(this.timeline_drag);

            this._window.bind({

                'mousemove': function(e) {

                    // Calculate new offsets.
                    var offsetX = e.pageX - startingX;
                    var offsetY = e.pageY - startingY;

                    // Apply new position.
                    self.timeline_drag.css({
                        'left': startingOffsetX + offsetX,
                        'top': startingOffsetY + offsetY
                    });

                    /*
                     * Repositioning listeners.
                     */

                    // MAP and ITEMS.
                    if (self._is_map && self._is_items) {

                        // Vertical switching between map and timeline.

                        // TIMELINE on top:
                        if (self._top_element == 'timeline') {

                            // ** Cursor down.
                            if (e.pageY > (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'map';
                                self.__slideMap(false);
                                self.__slideItems(false);
                            }

                        }

                        // MAP on top:
                        else if (self._top_element == 'map') {

                            // ** Cursor up.
                            if (e.pageY < (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'timeline';
                                self.__slideMap(false);
                                self.__slideItems(false);

                            }

                        }

                        // Horizontal switching between map and items.

                        if (self.__timelineIsLevelWithItems()) {

                            // ITEMS on right:
                            if (self._items_h_pos == 'right') {

                                // ** Cursor right.
                                if (e.pageX > (self.dragoxOffset.left + self.majorWidth)) {
                                    self._items_h_pos = 'left';
                                    self.__slideItems(false);
                                }

                            }

                            // ITEMS on left:
                            else if (self._items_h_pos == 'left') {

                                // ** Cursor left.
                                if (e.pageX < (self.dragoxOffset.left + self.minorWidth)) {
                                    self._items_h_pos = 'right';
                                    self.__slideItems(false);
                                }

                            }

                        }

                    }

                    // MAP:
                    else if (self._is_map && !self._is_items) {

                        // Vertical switching between map and timeline.

                        // TIMELINE on top:
                        if (self._top_element == 'timeline') {

                            // ** Cursor down.
                            if (e.pageY > (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'map';
                                self.__slideMap(false);
                            }

                        }

                        // MAP on top:
                        else if (self._top_element == 'map') {

                            // ** Cursor up.
                            if (e.pageY < (self.dragboxOffset.top + self.majorHeight)) {
                                self._top_element = 'timeline';
                                self.__slideMap(false);
                            }

                        }

                    }

                },

                'mouseup': function() {

                    self.__slideTimeline(true);
                    self._window.unbind('mousemove mouseup');

                }

            });

        },

        /*
         * Items drag handler.
         */
        __doItemsDrag: function(trigger_event_object) {

            // this._is_dragging = true;

            // // Get starting pointer coordinates.
            // var startingX = trigger_event_object.pageX;
            // var startingY = trigger_event_object.pageY;

            // // Get starting div offsets.
            // var StartingOffsetX = this.__getItemsLeftOffset();
            // var StartingOffsetY = this.__getItemsTopOffset();

            // // Set starting height and position status.
            // this._udi_height_at_start_of_drag = this._items_height;
            // this._udi_position_at_start_of_drag = (this._top_element == 'map') ? 'bottom' : 'top';

            // // Bind self.
            // var self = this;

            // // Create typable facades for vertical tier parameters.
            // var vt1 = this.options.css.vertical_offset_tier1;
            // var vt2 = this.options.css.vertical_offset_tier2;

            // // Make the drag div see-through and always on top.
            // this.items_drag.css({
            //     'opacity': 0.5,
            //     'z-index': 99
            // });

            // this._window.bind({

            //     'mousemove': function(e) {

            //         // Calculate new offsets.
            //         var offsetX = e.pageX - startingX;
            //         var offsetY = e.pageY - startingY;

            //         // Apply new position.
            //         self.items_drag.css({
            //             'left': StartingOffsetX + offsetX,
            //             'top': StartingOffsetY + offsetY
            //         });

            //         // Control flow to determine where/when the udi
            //         // should be animated as the mouse position changes.

            //         // If udi was partial-height at drag start.
            //         if (self._udi_height_at_start_of_drag == 'partial') {

            //             // If udi was on the bottom when the drag started.
            //             if (self._udi_position_at_start_of_drag == 'bottom') {

            //                 // If the mouse has moved upwards but has not crossed
            //                 // through the first offset tier.
            //                 if (offsetY < 0 && offsetY > -vt1) {
            //                     self._items_height = 'partial';
            //                     self._top_element = 'map';
            //                     self.__slideTimeline(false);
            //                     self.__slideMap(false);
            //                 }

            //                 // If the mouse has moved upwards and the vertical
            //                 // offset is between the two vertical offset tiers.
            //                 else if (offsetY < -vt1 && offsetY > -vt2) {
            //                     self._items_height = 'full';
            //                     self.__slideTimeline(false);
            //                     self.__slideMap(false);
            //                 }

            //                 // If the mouse has moved upwards and is over the
            //                 // second tier threshold.
            //                 else if (offsetY < -vt2) {
            //                     self._items_height = 'partial';
            //                     self._top_element = 'timeline';
            //                     self.__slideTimeline(false);
            //                     self.__slideMap(false);
            //                 }

            //             }

            //             // If udi was on the top when the drag started.
            //             else if (self._udi_position_at_start_of_drag == 'top') {

            //                 // If the mouse has moved downwards but has not crossed
            //                 // through the first offset tier.
            //                 if (offsetY > 0 && offsetY < vt1) {
            //                     self._items_height = 'partial';
            //                     self._top_element = 'timeline';
            //                     self.__slideTimeline(false);
            //                     self.__slideMap(false);
            //                 }

            //                 // If the mouse has moved downwards and the vertical
            //                 // offset is between the two vertical offset tiers.
            //                 else if (offsetY > vt1 && offsetY < vt2) {
            //                     self._items_height = 'full';
            //                     self.__slideTimeline(false);
            //                     self.__slideMap(false);
            //                 }

            //                 // If the mouse has moved downwards and is over the
            //                 // second tier threshold.
            //                 else if (offsetY > vt2) {
            //                     self._items_height = 'partial';
            //                     self._top_element = 'map';
            //                     self.__slideTimeline(false);
            //                     self.__slideMap(false);
            //                 }

            //             }

            //         }

            //         // If udi was full-height at the start of the drag.
            //         else if (self._udi_height_at_start_of_drag == 'full') {

            //             // If the mouse has moved upwards but has not crossed
            //             // through the first vertical tier.
            //             if (offsetY < 0 && offsetY > -vt1) {
            //                 self._items_height = 'full';
            //                 self.__slideTimeline(false);
            //                 self.__slideMap(false);
            //             }

            //             // If the mouse has moved upwards and has crossed through
            //             // the first vertical tier.
            //             else if (offsetY < -vt1) {
            //                 self._items_height = 'partial';
            //                 self._top_element = 'timeline';
            //                 self.__slideTimeline(false);
            //                 self.__slideMap(false);
            //             }

            //             // If the mouse has moved downwards but has not crossed
            //             // through the first vertical tier.
            //             else if (offsetY > 0 && offsetY < vt1) {
            //                 self._items_height = 'full';
            //                 self.__slideTimeline(false);
            //                 self.__slideMap(false);
            //             }

            //             // If the mouse has moved downwards and has crossed through
            //             // the first vertical tier.
            //             else if (offsetY > vt1) {
            //                 self._items_height = 'partial';
            //                 self._top_element = 'map';
            //                 self.__slideTimeline(false);
            //                 self.__slideMap(false);
            //             }

            //         }

            //         // If udi is on the right.
            //         if (self._items_position == 'right') {

            //             // If the cursor crosses over the centerline going left.
            //             if (e.pageX < (self._dragbox_position.left + self._dragbox_width / 2)) {

            //                 self._items_position = 'left';
            //                 self.__slideTimeline(false);

            //                 if (self._items_height == 'full') {
            //                     self.__slideMap(false);
            //                 }

            //             }

            //         }

            //         // If udi is on the left.
            //         else {

            //             // If the cursor crosses over the centerline going left.
            //             if (e.pageX > (self._dragbox_position.left + self._dragbox_width / 2)) {

            //                 self._items_position = 'right';
            //                 self.__slideTimeline(false);

            //                 if (self._items_height == 'full') {
            //                     self.__slideMap(false);
            //                 }

            //             }

            //         }

            //     },

            //     'mouseup': function() {

            //         self.__slideItems(true);
            //         self._window.unbind('mousemove mouseup');

            //     }

            // });

        },

        /*
         * Manifest new timeline position.
         *
         * - param boolean endingSlide: True if the slide was triggered by
         *   a mouseup on the dragger dif, which case the dragger should be
         *   pushed back to full opacity at the end of the slide tween.
         */
        __slideTimeline: function(endingSlide) {

            var self = this;

            // Capture the current positioning loadout.
            var newParams = [
                this._top_element,
                this._items_h_pos,
                this._items_v_pos,
                this._items_height
            ];

            // If there is a parameter change.
            if (!$.compare(newParams, this.lastParams) ||
                this._current_dragger == 'timeline') {

                // Recompute positions.
                this._computePositions();

                // If ending slide.
                if (endingSlide) {

                    // Slide the timeline.
                    this.timeline_drag.stop().animate({
                        'height': this.positions.timeline.height,
                        'width': this.positions.timeline.width,
                        'top': this.positions.timeline.top,
                        'left': this.positions.timeline.left,
                        'opacity': 1,
                        'z-index': 0
                    }, function() {
                        self._is_dragging = false;
                        self.timeline_drag.trigger('mouseleave');
                    });

                }

                // If not an ending slide.
                else {

                    // Slide the timeline.
                    this.timeline_drag.stop().animate({
                        'height': this.positions.timeline.height,
                        'width': this.positions.timeline.width,
                        'top': this.positions.timeline.top,
                        'left': this.positions.timeline.left
                    });

                }

                // Recenter the tag.
                this._animate_position_tag(
                    this.timeline_drag,
                    this.positions.timeline.height
                );

                // Capture the new positioning loadout.
                this.lastParams = [
                    this._top_element,
                    this._items_h_pos,
                    this._items_v_pos,
                    this._items_height
                ];

            }

        },

        /*
         * Manifest new map position.
         *
         * - param boolean endingSlide: True if the slide was triggered by
         *   a mouseup on the dragger dif, which case the dragger should be
         *   pushed back to full opacity at the end of the slide tween.
         */
        __slideMap: function(endingSlide) {

            var self = this;

            // Capture the current positioning loadout.
            var newParams = [
                this._top_element,
                this._items_h_pos,
                this._items_v_pos,
                this._items_height
            ];

            // If there is a parameter change.
            if (!$.compare(newParams, this.lastParams) ||
                this._current_dragger == 'map') {

                // Recompute positions.
                this._computePositions();

                // If ending slide.
                if (endingSlide) {

                    // Slide the timeline.
                    this.map_drag.stop().animate({
                        'height': this.positions.map.height,
                        'width': this.positions.map.width,
                        'top': this.positions.map.top,
                        'left': this.positions.map.left,
                        'opacity': 1,
                        'z-index': 0
                    }, function() {
                        self._is_dragging = false;
                        self.map_drag.trigger('mouseleave');
                    });

                }

                // If not an ending slide.
                else {

                    // Slide the timeline.
                    this.map_drag.stop().animate({
                        'height': this.positions.map.height,
                        'width': this.positions.map.width,
                        'top': this.positions.map.top,
                        'left': this.positions.map.left
                    });

                }

                // Recenter the tag.
                this._animate_position_tag(
                    this.map_drag,
                    this.positions.map.height
                );

                // Capture the new positioning loadout.
                this.lastParams = [
                    this._top_element,
                    this._items_h_pos,
                    this._items_v_pos,
                    this._items_height
                ];

            }

        },

        /*
         * Manifest new items position.
         *
         * - param boolean endingSlide: True if the slide was triggered by
         *   a mouseup on the dragger dif, which case the dragger should be
         *   pushed back to full opacity at the end of the slide tween.
         */
        __slideItems: function(endingSlide) {

            var self = this;

            // Capture the current positioning loadout.
            var newParams = [
                this._top_element,
                this._items_h_pos,
                this._items_v_pos,
                this._items_height
            ];

            // If there is a parameter change.
            if (!$.compare(newParams, this.lastParams) ||
                this._current_dragger == 'items') {

                // Recompute positions.
                this._computePositions();

                // If ending slide.
                if (endingSlide) {

                    // Slide the timeline.
                    this.items_drag.stop().animate({
                        'height': this.positions.items.height,
                        'width': this.positions.items.width,
                        'top': this.positions.items.top,
                        'left': this.positions.items.left,
                        'opacity': 1,
                        'z-index': 0
                    }, function() {
                        self._is_dragging = false;
                        self.items_drag.trigger('mouseleave');
                    });

                }

                // If not an ending slide.
                else {

                    // Slide the timeline.
                    this.items_drag.stop().animate({
                        'height': this.positions.items.height,
                        'width': this.positions.items.width,
                        'top': this.positions.items.top,
                        'left': this.positions.items.left
                    });

                }

                // Recenter the tag.
                this._animate_position_tag(
                    this.tems_drag,
                    this.positions.items.height
                );

                // Capture the new positioning loadout.
                this.lastParams = [
                    this._top_element,
                    this._items_h_pos,
                    this._items_v_pos,
                    this._items_height
                ];

            }

        },


        /*
         * =================
         * Positioning calculators and DOM helpers.
         * =================
         */


        /*
         * Build the map dragger.
         */
        __createMapDiv: function() {

            return $('<div id="drag-map" class="draggable">\
                        <span class="drag-tag">Map</span>\
                      </div>');

        },

        /*
         * Build the timeline dragger.
         */
        __createTimelineDiv: function() {

            return $('<div id="drag-timeline" class="draggable">\
                        <span class="drag-tag">Timeline</span>\
                      </div>');

        },

        /*
         * Build the items dragger.
         */
        __createItemsDiv: function() {

            return $('<div id="drag-items" class="draggable">\
                        <span class="drag-tag">Items</span>\
                      </div>');

        },

        /*
         * Fade out a drag box when a drag event starts.
         */
        __fadeDragger: function(dragger) {

            dragger.css({
                'opacity': 0.5,
                'z-index': 99
            })

        },

        /*
         * Return boolean true if the map dragger is horizontally level with
         * the items block, and the items block is partial height.
         *
         * - return boolean: True if the map is level with ITEMS.
         */
        __mapIsLevelWithItems: function() {

            // If all three blocks are present.
            if (this._is_map && this._is_timeline && this._is_items) {

                if (this._top_element == 'map' &&
                    this._items_height == 'partial' &&
                    this._items_v_pos == 'top') {

                    return true;

                }

                if (this._top_element == 'timeline' &&
                    this._items_height == 'partial' &&
                    this._items_v_pos == 'bottom') {

                    return true;

                }

            }

            // If just the map and items are present.
            else if (this._is_map && !this._is_timeline && this._is_items) {
                return true;
            }

            return false;

        },

        /*
         * Return boolean true if the timeline dragger is horizontally level with
         * the items block, and the items block is partial height.
         *
         * - return boolean: True if the timeline is level with ITEMS.
         */
        __timelineIsLevelWithItems: function() {

            // If all three blocks are present.
            if (this._is_map && this._is_timeline && this._is_items) {

                if (this._top_element == 'timeline' &&
                    this._items_height == 'partial' &&
                    this._items_v_pos == 'top') {

                    return true;

                }

                if (this._top_element == 'map' &&
                    this._items_height == 'partial' &&
                    this._items_v_pos == 'bottom') {

                    return true;

                }

            }

            // If just the map and items are present.
            else if (!this._is_map && this._is_timeline && this._is_items) {
                return true;
            }

            return false;

        },

        __getItemsHeight: function() {

            var height = null;

            if (this._items_height == 'full') {
                height = this._dragbox_height;
            }

            else {

                if (this._is_map) {

                    if (this._top_element == 'map') {
                        height = this._bottom_block_height;
                    }

                    else {
                        height = this._top_block_height;
                    }

                }

                else {
                    height = this._dragbox_height;
                }

            }

            return height;

        },

        __getItemsWidth: function() {

            return this.options.css.undated_items_width;

        },

        __getItemsLeftOffset: function() {

            var left_offset = null;

            if (this._items_position == 'left') {
                left_offset = 0;
            }

            else {
                left_offset = this._undated_items_left_offset;
            }

            return left_offset;

        },

        __getItemsTopOffset: function() {

            var top_offset = null;

            if (this._items_height == 'full') {
                top_offset = 0;
            }

            else {

                if (this._is_map) {

                    if (this._top_element == 'map') {
                        top_offset = this._top_block_height;
                    }

                    else {
                        top_offset = 0;
                    }

                }

                else {
                    top_offset = 0;
                }

            }

            return top_offset;

        },

        __getMapWidth: function() {

            var width = this._dragbox_width;

            if (this._items_height == 'full' && this._is_items) {
                width -= this.options.css.undated_items_width;
            }

            return width;

        },

        __getMapHeight: function() {

            var height = this._top_block_height;

            if (this._is_timeline) {
                if (this._top_element == 'map') {
                    height = this._top_block_height;
                }
                else {
                    height = this._bottom_block_height;
                }
            }

            else {
                height = this._dragbox_height;
            }

            return height;

        },

        __getMapLeftOffset: function() {

            var offset = 0;

            if (this._items_height == 'full'
                && this._is_items
                && this._items_position == 'left') {

                    offset = this.options.css.undated_items_width;

            }

            return offset;

        },

        __getMapTopOffset: function() {

            var offset = 0;

            if (this._top_element == 'timeline' && this._is_timeline) {
                offset = this._top_block_height;
            }

            return offset;

        },

        __getTimelineWidth: function() {

            var width = this._dragbox_width;

            if (this._is_items) {
                width -= this.options.css.undated_items_width;
            }

            return width;

        },

        __getTimelineHeight: function() {

            var height = this._bottom_block_height;

            if (this._is_map) {
                if (this._top_element == 'timeline') {
                    height = this._top_block_height;
                }
            }

            else {
                height = this._dragbox_height;
            }

            return height;

        },

        __getTimelineLeftOffset: function() {

            var offset = 0;

            if (this._is_items && this._items_position == 'left') {
                offset = this.options.css.undated_items_width;
            }

            return offset;

        },

        __getTimelineTopOffset: function() {

            var offset = 0;

            if (this._top_element == 'map' && this._is_map) {
                offset = this._top_block_height;
            }

            return offset;

        },

        getArrangementParameters: function() {

            // Prep booleans for the database.
            var is_map = this._is_map ? 1 : 0;
            var is_timeline = this._is_timeline ? 1 : 0;
            var is_undated_items = this._is_items ? 1 : 0;

            // Assemble an object with the position tracker variables.
            return {
                neatline_id: Neatline.id,
                is_map: is_map,
                is_timeline: is_timeline,
                is_undated_items: is_undated_items,
                top_element: this._top_element,
                udi_position: this._items_position,
                udi_height: this._items_height
            }

        }

    });


    $.extend({

        /*
         * Evaluate two arrays for equality.
         */
        compare: function(array1, array2) {

            if (array1 == null || array2 == null) {
                return false;
            }

            if (array1.length != array2.length) {
                return false;
            }

            var a = $.extend(true, [], array1);
            var b = $.extend(true, [], array2);

            a.sort();
            b.sort();

            for (var i = 0, len = a.length; i < len; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }

            return true

        }

    });


})( jQuery );
