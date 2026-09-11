import { act, renderHook } from '@testing-library/react-native';

import { _reinitialiserPourTests, consigner } from '@/services/journal';
import { AsyncStorage } from '@/services/stockage';
import { useJournal } from '@/features/journal/hooks';

describe('useJournal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    _reinitialiserPourTests();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('reflète les entrées consignées après montage, du plus récent au plus ancien', async () => {
    const { result } = await renderHook(() => useJournal());

    await act(async () => {
      consigner('info', 'un');
      consigner('erreur', 'deux');
    });

    expect(result.current.total).toBe(2);
    expect(result.current.entrees.map((e) => e.message)).toEqual(['deux', 'un']);
  });

  it('filtre par niveau via definirNiveau, sans changer le total', async () => {
    const { result } = await renderHook(() => useJournal());

    await act(async () => {
      consigner('info', 'un');
      consigner('erreur', 'deux');
    });
    await act(async () => result.current.definirNiveau('erreur'));

    expect(result.current.entrees).toHaveLength(1);
    expect(result.current.entrees[0].message).toBe('deux');
    expect(result.current.total).toBe(2);
  });

  it('vider() efface le journal exposé par le hook', async () => {
    const { result } = await renderHook(() => useJournal());

    await act(async () => consigner('info', 'à effacer'));
    expect(result.current.total).toBe(1);

    await act(async () => result.current.vider());
    expect(result.current.total).toBe(0);
  });
});
