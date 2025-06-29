import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DocDesktopUIGettingStartedComponent } from './getting-started.component.js';
import { DocDesktopUIIconComponent } from './icon.component.js';
import { DocDesktopUIButtonComponent } from './button.component.js';
import { DocDesktopUIButtonGroupComponent } from './button-group.component.js';
import { DocDesktopUIDialogComponent } from './dialog.component.js';
import { DocDesktopUIFormComponent } from './form.component.js';
import { DocDesktopUIInputComponent } from './input.component.js';
import { DocDesktopUIListComponent } from './list.component.js';
import { DocDesktopUIMenuComponent } from './menu.component.js';
import { DocDesktopUIRadioButtonComponent } from './radiobox.component.js';
import { DocDesktopUISelectboxComponent } from './selectbox.component.js';
import { DocDesktopUISliderComponent } from './slider.component.js';
import { DocDesktopUITableComponent } from './table.component.js';
import { DocDesktopUIWindowToolbarComponent } from './window-toolbar.component.js';
import { DocDesktopUIWindowComponent } from './window.component.js';
import { DocDesktopUICheckboxComponent } from './checkbox.component.js';
import { DocDesktopUIButtonDropdownComponent } from './dropdown.component.js';
import { DocDesktopUIAppComponent } from './app.component.js';
import { DocDesktopUIDragComponent } from './drag.component.js';
import { DocDesktopUITabsComponent } from './tabs.component.js';
import { DesktopUIIndexComponent } from './index.component.js';
import { DocDesktopUIAdaptiveContainerComponent } from './adaptive-container.component.js';
import { DocDesktopUIStylesComponent } from '@app/app/pages/documentation/desktop-ui/styles.component.js';

const routes: Routes = [
    {
        path: '', component: DesktopUIIndexComponent, children: [
            { path: 'getting-started', component: DocDesktopUIGettingStartedComponent },
            { path: 'icons', component: DocDesktopUIIconComponent },
            { path: 'styles', component: DocDesktopUIStylesComponent },
            { path: 'adaptive-container', component: DocDesktopUIAdaptiveContainerComponent },
            { path: 'button', component: DocDesktopUIButtonComponent },
            { path: 'button-group', component: DocDesktopUIButtonGroupComponent },
            { path: 'app', component: DocDesktopUIAppComponent },
            { path: 'drag', component: DocDesktopUIDragComponent },
            { path: 'dropdown', component: DocDesktopUIButtonDropdownComponent },
            { path: 'dialog', component: DocDesktopUIDialogComponent },
            { path: 'form', component: DocDesktopUIFormComponent },
            { path: 'indicator', component: DocDesktopUIInputComponent },
            { path: 'input', component: DocDesktopUIInputComponent },
            { path: 'list', component: DocDesktopUIListComponent },
            { path: 'checkbox', component: DocDesktopUICheckboxComponent },
            { path: 'menu', component: DocDesktopUIMenuComponent },
            { path: 'radio', component: DocDesktopUIRadioButtonComponent },
            { path: 'select', component: DocDesktopUISelectboxComponent },
            { path: 'slider', component: DocDesktopUISliderComponent },
            { path: 'table', component: DocDesktopUITableComponent },
            { path: 'window', component: DocDesktopUIWindowComponent },
            { path: 'window-toolbar', component: DocDesktopUIWindowToolbarComponent },
            { path: 'tabs', component: DocDesktopUITabsComponent },
        ],
    },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),
    ],
})
export class DocDesktopUIModule {
}
