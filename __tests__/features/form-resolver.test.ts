import { schemaFormulaireLivre, versSaisie } from '@/features/books/form';
import { zodResolver } from '@hookform/resolvers/zod';

describe('schemaFormulaireLivre', () => {
  it('valide une saisie complète correcte', () => {
    const r = schemaFormulaireLivre.safeParse({
      titre: 'Le Hobbit',
      auteur: 'Tolkien',
      editeur: '',
      annee: 2020,
      lu: false,
      favori: false,
      note: null,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(versSaisie(r.data).titre).toBe('Le Hobbit');
  });

  it('le resolver RHF accepte une saisie valide (pas d\'erreurs)', async () => {
    const resolver = zodResolver(schemaFormulaireLivre);
    const valeurs = {
      titre: 'Titre',
      auteur: 'Auteur',
      editeur: '',
      annee: 2020,
      lu: false,
      favori: false,
      note: null,
    };
    const res = await resolver(valeurs as never, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    } as never);
    expect(res.errors).toEqual({});
    expect((res.values as { titre?: string }).titre).toBe('Titre');
  });
});
