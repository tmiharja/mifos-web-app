/*
 * Prepare environment for unit tests.
 * This file is required by karma.conf.js and loads recursively all the .spec and framework files.
 */

import 'zone.js/dist/zone-testing';
import { NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { getTestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';

declare const require: any;

/**
 * Root-level providers shared by every spec. Individual specs can still override
 * these through `TestBed.configureTestingModule`.
 */
@NgModule({
  imports: [
    HttpClientTestingModule,
    RouterTestingModule,
    ReactiveFormsModule,
    MatDialogModule,
    NoopAnimationsModule,
    TranslateModule.forRoot()
  ],
  providers: [
    DatePipe,
    { provide: MatDialogRef, useValue: {} },
    { provide: MAT_DIALOG_DATA, useValue: {} }]
})
class TestEnvironmentModule {}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  [
    BrowserDynamicTestingModule,
    TestEnvironmentModule
  ],
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
