import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DataRevision, reloadOnDataChange } from './data-revision';

describe('reloadOnDataChange', () => {
  it('lädt erst nach einem Schreibvorgang neu, nicht beim Start', async () => {
    const target = { reload: vi.fn(() => true) };

    @Component({ template: '' })
    class Host {
      constructor() {
        reloadOnDataChange(target);
      }
    }

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(target.reload).not.toHaveBeenCalled();

    TestBed.inject(DataRevision).bump();
    await fixture.whenStable();
    expect(target.reload).toHaveBeenCalledTimes(1);
  });
});
