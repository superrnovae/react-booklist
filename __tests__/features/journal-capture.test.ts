const mockSurErreurGlobale = jest.fn();
jest.mock('@/services/erreursGlobales', () => ({
  surErreurGlobale: (...args: unknown[]) => mockSurErreurGlobale(...args),
}));
const mockConsigner = jest.fn();
jest.mock('@/services/journal', () => ({
  consigner: (...args: unknown[]) => mockConsigner(...args),
}));

import { demarrerCaptureErreursGlobales } from '@/features/journal/capture';

describe('demarrerCaptureErreursGlobales', () => {
  beforeEach(() => {
    mockSurErreurGlobale.mockReset();
    mockConsigner.mockReset();
  });

  it("s'abonne à surErreurGlobale et consigne au niveau erreur", () => {
    let rappelCapture: (erreur: unknown, fatale: boolean) => void = () => {};
    const desabonnerMock = jest.fn();
    mockSurErreurGlobale.mockImplementation((cb: typeof rappelCapture) => {
      rappelCapture = cb;
      return desabonnerMock;
    });

    const desabonner = demarrerCaptureErreursGlobales();
    expect(mockSurErreurGlobale).toHaveBeenCalledTimes(1);

    const echec = new Error('composant en panne');
    rappelCapture(echec, false);

    expect(mockConsigner).toHaveBeenCalledWith(
      'erreur',
      'Erreur globale non interceptée',
      expect.objectContaining({ erreur: echec, contexte: { fatale: false } }),
    );

    desabonner();
    expect(desabonnerMock).toHaveBeenCalledTimes(1);
  });

  it('distingue une erreur fatale dans le message consigné', () => {
    let rappelCapture: (erreur: unknown, fatale: boolean) => void = () => {};
    mockSurErreurGlobale.mockImplementation((cb: typeof rappelCapture) => {
      rappelCapture = cb;
      return () => {};
    });

    demarrerCaptureErreursGlobales();
    rappelCapture(new Error('crash natif'), true);

    expect(mockConsigner).toHaveBeenCalledWith(
      'erreur',
      'Erreur globale fatale, non interceptée',
      expect.objectContaining({ contexte: { fatale: true } }),
    );
  });
});
