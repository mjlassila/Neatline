<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4; */

/**
 * Static delete page.
 *
 * PHP version 5
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
?>

<?php
head(array('content_class' => 'neatline'));
?>

<?php echo $this->partial('index/_header.php', array(
    'tab' => 'maps',
    'add_button_uri' => 'neatline-maps/maps/create',
    'add_button_text' => 'Create a Map'
)); ?>

<div id="primary" class="neatline-delete-confirm-static">

    <h1>Are you sure?</h1>
    <p>This will permanently delete the <span class="neatline-delete-exbitit-name">
        exhibit. Spatial and temporal metadata added by way of the Neatline interface
        is stored at the level of the items themselves, and will be unaffected.</p>

    <div class="alert-actions">

        <?php echo neatline_deleteConfirmForm(); ?>

    </div>

</div>

<?php
foot();
?>