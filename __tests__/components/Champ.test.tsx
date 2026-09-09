import { Champ } from '@/components/Champ';
import { rendreAvecTheme, screen } from '../utils/rendu';

describe('<Champ />', () => {
  it('affiche le libellé et la valeur', async () => {
    await rendreAvecTheme(<Champ libelle="Titre" value="Le Hobbit" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Titre').props.value).toBe('Le Hobbit');
  });

  it('affiche un message d\'erreur par champ avec le rôle alert', async () => {
    await rendreAvecTheme(
      <Champ libelle="Titre" value="" onChangeText={() => {}} erreur="Ce champ est obligatoire." />,
    );
    expect(screen.getByText('Ce champ est obligatoire.').props.accessibilityRole).toBe('alert');
  });
});
