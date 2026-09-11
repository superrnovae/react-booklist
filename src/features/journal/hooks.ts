/**
 * Hook de lecture réactive du journal structuré (§ Lot 5) pour l'écran
 * Journal. La collecte elle-même vit dans services/journal.ts ; ce hook ne
 * fait qu'abonner un composant à ses mises à jour.
 */
import type { EntreeJournal, NiveauJournal } from '@/domain/journal';
import { filtrerParNiveau } from '@/domain/journal';
import { surJournal, viderJournal } from '@/services/journal';
import { useEffect, useMemo, useState } from 'react';

export function useJournal() {
  const [journal, setJournal] = useState<EntreeJournal[]>([]);
  const [niveau, setNiveau] = useState<NiveauJournal | 'tous'>('tous');

  useEffect(() => surJournal(setJournal), []);

  const filtre = useMemo(() => filtrerParNiveau(journal, niveau).slice().reverse(), [journal, niveau]);

  return { entrees: filtre, total: journal.length, niveau, definirNiveau: setNiveau, vider: viderJournal };
}
