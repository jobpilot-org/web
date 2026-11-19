import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TopBar } from './top-bar';

@Component({ template: '' })
class Empty {}

async function activeTabAt(url: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', component: Empty }])],
  });
  const fixture = TestBed.createComponent(TopBar);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  fixture.detectChanges();
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('.jp-tab.is-active')].map(
    (tab) => tab.textContent?.trim(),
  );
}

describe('TopBar', () => {
  it('markiert genau den Tab der aktuellen Seite', async () => {
    expect(await activeTabAt('/')).toEqual(['Übersicht']);
    TestBed.resetTestingModule();
    expect(await activeTabAt('/auswertung')).toEqual(['Auswertung']);
  });

  it('zählt Detailseite und Formulare zum Tab „Bewerbungen“', async () => {
    expect(await activeTabAt('/bewerbung/a1/kontakt')).toEqual(['Bewerbungen']);
  });
});
