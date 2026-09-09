import { EtoilesNote } from '@/components/EtoilesNote';
import { fireEvent } from '@testing-library/react-native';
import { rendreAvecTheme, screen } from '../utils/rendu';

describe('<EtoilesNote />', () => {
  it('expose la note courante pour l\'accessibilité', async () => {
    await rendreAvecTheme(<EtoilesNote valeur={3} onChange={() => {}} libelle="Note" />);
    expect(screen.getByLabelText('Note').props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3 });
  });

  it('appelle onChange avec l\'étoile choisie', async () => {
    const onChange = jest.fn();
    await rendreAvecTheme(<EtoilesNote valeur={0} onChange={onChange} libelle="Note" />);
    fireEvent.press(screen.getByLabelText('Note : 4'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
