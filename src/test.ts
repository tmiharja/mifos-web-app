/*
 * Prepare environment for unit tests.
 * This file is required by karma.conf.js and loads recursively all the .spec and framework files.
 */

import 'zone.js/dist/zone-testing';
import { NgModule } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CdkStepper } from '@angular/cdk/stepper';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { getTestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from './app/shared/shared.module';
import { PipesModule } from './app/pipes/pipes.module';
import { DirectivesModule } from './app/directives/directives.module';
import { AuthenticationService } from './app/core/authentication/authentication.service';
import { AuthenticationInterceptor } from './app/core/authentication/authentication.interceptor';
import { HttpCacheService } from './app/core/http/http-cache.service';
import { ProgressBarService } from './app/core/progress-bar/progress-bar.service';

declare const require: any;

/** Fake logged-in super user so permission-guarded templates render. */
sessionStorage.setItem(
  'mifosXCredentials',
  JSON.stringify({
    username: 'mifos',
    userId: 1,
    base64EncodedAuthenticationKey: 'bWlmb3M6cGFzc3dvcmQ=',
    authenticated: true,
    officeId: 1,
    officeName: 'Head Office',
    roles: [],
    permissions: ['ALL_FUNCTIONS'],
    shouldRenewPassword: false,
    isTwoFactorAuthenticationRequired: false,
    rememberMe: false
  })
);

/** Minimal ActivatedRoute stand-in with an empty (self-referencing) parent chain. */
const activatedRouteStub: any = {
  snapshot: { params: {}, queryParams: {}, data: {}, url: [], paramMap: new Map(), queryParamMap: new Map() },
  params: of({}),
  queryParams: of({}),
  data: of({}),
  url: of([]),
  fragment: of(null)
};
activatedRouteStub.parent = activatedRouteStub;
activatedRouteStub.snapshot.parent = activatedRouteStub.snapshot;

/**
 * Root-level modules and providers shared by every spec, mirroring what the
 * application's feature modules import (SharedModule, pipes, directives) so that
 * the generated `should create` specs can compile component templates.
 * Individual specs can still override these through `TestBed.configureTestingModule`.
 */
@NgModule({
  imports: [
    HttpClientTestingModule,
    RouterTestingModule,
    ReactiveFormsModule,
    MatDialogModule,
    NoopAnimationsModule,
    TranslateModule.forRoot(),
    SharedModule,
    PipesModule,
    DirectivesModule
  ],
  exports: [
    HttpClientTestingModule,
    RouterTestingModule,
    ReactiveFormsModule,
    MatDialogModule,
    NoopAnimationsModule,
    TranslateModule,
    SharedModule,
    PipesModule,
    DirectivesModule
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    AuthenticationService,
    AuthenticationInterceptor,
    HttpCacheService,
    ProgressBarService,
    { provide: ActivatedRoute, useValue: activatedRouteStub },
    { provide: CdkStepper, useValue: {} },
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
