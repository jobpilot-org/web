import { toAppointment, toContact, toNote } from './details.repository';

const base = { user_id: '11111111-1111-1111-1111-111111111111', application_id: 'a1' };

describe('Details-Mapper', () => {
  it('übernimmt Kontakte und lässt leere Spalten weg', () => {
    expect(
      toContact({
        ...base,
        id: 'c1',
        name: 'Kim',
        role: 'Recruiterin',
        email: null,
        phone: null,
        linkedin_url: null,
        created_at: '2026-11-01T08:00:00+00:00',
      }),
    ).toEqual({
      id: 'c1',
      applicationId: 'a1',
      name: 'Kim',
      role: 'Recruiterin',
      email: undefined,
      phone: undefined,
      linkedinUrl: undefined,
    });
  });

  it('normalisiert Zeitpunkte von Notizen und Terminen', () => {
    expect(
      toNote({ ...base, id: 'n1', body: 'Hallo', created_at: '2026-11-01T09:00:00+01:00' }),
    ).toEqual({
      id: 'n1',
      applicationId: 'a1',
      body: 'Hallo',
      createdAt: '2026-11-01T08:00:00.000Z',
    });

    expect(
      toAppointment({
        ...base,
        id: 't1',
        kind: 'video',
        starts_at: '2026-11-25T10:00:00+01:00',
        location: null,
        notes: 'Kamera an',
        created_at: '2026-11-01T08:00:00+00:00',
      }),
    ).toEqual({
      id: 't1',
      applicationId: 'a1',
      kind: 'video',
      startsAt: '2026-11-25T09:00:00.000Z',
      location: undefined,
      notes: 'Kamera an',
    });
  });
});
