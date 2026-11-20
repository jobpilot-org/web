import { ToastService } from './toast.service';

describe('ToastService', () => {
  afterEach(() => vi.useRealTimers());

  it('blendet den Hinweis nach der Anzeigedauer aus', () => {
    vi.useFakeTimers();
    const toasts = new ToastService();
    toasts.show({ message: 'Gelöscht' }, 1000);
    expect(toasts.current()?.message).toBe('Gelöscht');
    vi.advanceTimersByTime(1000);
    expect(toasts.current()).toBeNull();
  });

  it('ein neuer Hinweis ersetzt den alten samt Zeitgeber', () => {
    vi.useFakeTimers();
    const toasts = new ToastService();
    toasts.show({ message: 'Erster' }, 1000);
    vi.advanceTimersByTime(800);
    toasts.show({ message: 'Zweiter' }, 1000);
    vi.advanceTimersByTime(800);
    expect(toasts.current()?.message).toBe('Zweiter');
  });
});
